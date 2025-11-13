<?php
/**
 * Script de verificación del backend PHP
 * Ejecutar para diagnosticar problemas
 */

echo "🔍 Verificando Backend PHP...\n";
echo "================================\n\n";

// Test 1: Verificar PHP
echo "📋 Test 1: Versión de PHP\n";
echo "PHP Version: " . PHP_VERSION . "\n";
echo "PHP SAPI: " . php_sapi_name() . "\n\n";

// Test 2: Verificar archivos principales
echo "📁 Test 2: Archivos principales\n";
$files = [
    'src/Controllers/UserController.php',
    'src/Models/User.php',
    'src/Utils/Response.php',
    'src/Utils/Security.php',
    'src/Routes/api.php',
    'src/Router.php'
];

foreach ($files as $file) {
    if (file_exists($file)) {
        echo "✅ $file - EXISTS\n";
    } else {
        echo "❌ $file - MISSING\n";
    }
}

echo "\n";

// Test 3: Verificar sintaxis de archivos críticos
echo "🔍 Test 3: Verificar sintaxis PHP\n";
$criticalFiles = [
    'src/Controllers/UserController.php',
    'src/Utils/Security.php',
    'src/Routes/api.php'
];

foreach ($criticalFiles as $file) {
    if (file_exists($file)) {
        $output = [];
        $return_var = 0;
        exec("php -l $file 2>&1", $output, $return_var);
        
        if ($return_var === 0) {
            echo "✅ $file - SYNTAX OK\n";
        } else {
            echo "❌ $file - SYNTAX ERROR:\n";
            foreach ($output as $line) {
                echo "   $line\n";
            }
        }
    }
}

echo "\n";

// Test 4: Verificar autoloader
echo "🔄 Test 4: Verificar autoloader\n";
if (file_exists('vendor/autoload.php')) {
    echo "✅ Composer autoloader found\n";
    require_once 'vendor/autoload.php';
} else {
    echo "⚠️  No composer autoloader, checking manual includes\n";
}

// Test 5: Verificar clases principales
echo "\n🏗️  Test 5: Verificar clases\n";
$classes = [
    'App\\Controllers\\UserController',
    'App\\Utils\\Response',
    'App\\Utils\\Security'
];

foreach ($classes as $class) {
    if (class_exists($class)) {
        echo "✅ $class - EXISTS\n";
    } else {
        echo "❌ $class - NOT FOUND\n";
    }
}

echo "\n";

// Test 6: Verificar extensiones PHP necesarias
echo "🔧 Test 6: Extensiones PHP\n";
$extensions = ['openssl', 'json', 'pdo', 'curl'];
foreach ($extensions as $ext) {
    if (extension_loaded($ext)) {
        echo "✅ $ext - LOADED\n";
    } else {
        echo "❌ $ext - MISSING\n";
    }
}

echo "\n";

// Test 7: Simular carga de UserController
echo "🧪 Test 7: Cargar UserController\n";
try {
    if (file_exists('src/Controllers/UserController.php')) {
        // Definir namespace manualmente si no hay autoloader
        if (!class_exists('App\\Controllers\\UserController')) {
            // Simular las dependencias necesarias
            if (!class_exists('App\\Utils\\Response')) {
                echo "⚠️  Creando mock de Response class\n";
                eval('
                namespace App\\Utils {
                    class Response {
                        public static function unauthorized() { echo "unauthorized"; }
                        public static function success($data) { echo "success"; }
                        public static function error($msg, $code, $data, $status) { echo "error"; }
                        public static function serverError($msg) { echo "server error"; }
                    }
                }
                ');
            }
            
            include_once 'src/Controllers/UserController.php';
        }
        
        if (class_exists('App\\Controllers\\UserController')) {
            echo "✅ UserController loaded successfully\n";
        } else {
            echo "❌ UserController failed to load\n";
        }
    }
} catch (Exception $e) {
    echo "❌ Error loading UserController: " . $e->getMessage() . "\n";
} catch (ParseError $e) {
    echo "❌ Parse error in UserController: " . $e->getMessage() . "\n";
}

echo "\n";
echo "🏁 Verificación completada\n";
echo "Si hay errores arriba, esos son los problemas que causan el error 500\n";
?>
