<?php
/**
 * Migración para crear la tabla wordpress_credentials
 */

require_once __DIR__ . '/src/Database/Connection.php';

use App\Database\Connection;

try {
    $pdo = Connection::getInstance();
    
    echo "🚀 Ejecutando migración de wordpress_credentials...\n";
    
    // Crear la tabla
    $sql = "
    CREATE TABLE IF NOT EXISTS `wordpress_credentials` (
      `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
      `user_id` int(10) UNSIGNED NOT NULL COMMENT 'ID del usuario',
      `website_id` int(10) UNSIGNED NOT NULL COMMENT 'ID del sitio web',
      `username` varchar(100) NOT NULL COMMENT 'Nombre de usuario de WordPress',
      `app_password` varchar(255) NOT NULL COMMENT 'Contraseña de aplicación encriptada',
      `is_active` tinyint(1) DEFAULT 1 COMMENT 'Credenciales activas/inactivas',
      `last_tested` timestamp NULL DEFAULT NULL COMMENT 'Última vez que se probó la conexión',
      `test_status` enum('success','failed','pending') DEFAULT 'pending' COMMENT 'Estado de la última prueba',
      `created_at` timestamp NULL DEFAULT current_timestamp(),
      `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (`id`),
      UNIQUE KEY `unique_user_website_credentials` (`user_id`,`website_id`),
      KEY `idx_user_id` (`user_id`),
      KEY `idx_website_id` (`website_id`),
      KEY `idx_is_active` (`is_active`),
      KEY `idx_test_status` (`test_status`),
      CONSTRAINT `fk_wordpress_credentials_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
      CONSTRAINT `fk_wordpress_credentials_website` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Credenciales de WordPress por usuario y sitio web'
    ";
    
    $pdo->exec($sql);
    
    echo "✅ Tabla wordpress_credentials creada exitosamente\n";
    
    // Verificar que la tabla existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'wordpress_credentials'");
    if ($stmt->rowCount() > 0) {
        echo "✅ Verificación: Tabla existe en la base de datos\n";
        
        // Mostrar estructura de la tabla
        $stmt = $pdo->query("DESCRIBE wordpress_credentials");
        $columns = $stmt->fetchAll();
        
        echo "\n📋 Estructura de la tabla:\n";
        foreach ($columns as $column) {
            echo "  - {$column['Field']}: {$column['Type']}\n";
        }
        
    } else {
        echo "❌ Error: La tabla no se creó correctamente\n";
    }
    
    echo "\n🎉 Migración completada exitosamente\n";
    
} catch (Exception $e) {
    echo "❌ Error en la migración: " . $e->getMessage() . "\n";
    echo "📍 Archivo: " . $e->getFile() . "\n";
    echo "📍 Línea: " . $e->getLine() . "\n";
}
?>
