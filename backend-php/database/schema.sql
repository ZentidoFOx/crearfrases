-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 11-11-2025 a las 11:05:25
-- Versión del servidor: 11.4.8-MariaDB-cll-lve
-- Versión de PHP: 8.3.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `jynxntxn_writer`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ai_models`
--

CREATE TABLE `ai_models` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL COMMENT 'Nombre del modelo',
  `provider` varchar(50) NOT NULL COMMENT 'Proveedor (OpenAI, Google, etc)',
  `api_key` varchar(255) NOT NULL COMMENT 'API Key del modelo',
  `endpoint` varchar(255) DEFAULT NULL COMMENT 'URL del endpoint',
  `description` text DEFAULT NULL COMMENT 'Descripción del modelo',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Modelo activo/inactivo',
  `created_by` int(10) UNSIGNED NOT NULL COMMENT 'Usuario que creó el modelo',
  `updated_by` int(10) UNSIGNED DEFAULT NULL COMMENT 'Usuario que actualizó',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Modelos de IA configurados en el sistema';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `api_requests`
--

CREATE TABLE `api_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `website_id` int(10) UNSIGNED DEFAULT NULL,
  `endpoint` varchar(255) NOT NULL,
  `method` varchar(10) DEFAULT 'GET',
  `status_code` int(11) DEFAULT NULL,
  `response_time` int(11) DEFAULT NULL COMMENT 'Tiempo de respuesta en milisegundos',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `request_body` text DEFAULT NULL,
  `response_body` text DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `articles`
--

CREATE TABLE `articles` (
  `id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL COMMENT 'Título del artículo',
  `h1_title` varchar(255) DEFAULT NULL COMMENT 'Título H1 (puede ser diferente al SEO title)',
  `keyword` varchar(100) NOT NULL COMMENT 'Palabra clave principal',
  `objective_phrase` varchar(255) DEFAULT NULL COMMENT 'Frase objetivo o palabra clave adicional',
  `keywords_array` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array de palabras clave relacionadas' CHECK (json_valid(`keywords_array`)),
  `slug` varchar(255) NOT NULL COMMENT 'URL-friendly identifier',
  `content` longtext NOT NULL COMMENT 'Contenido completo en Markdown',
  `sections_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Estructura de secciones del artículo' CHECK (json_valid(`sections_json`)),
  `meta_description` text DEFAULT NULL COMMENT 'Meta descripción para SEO',
  `seo_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Datos SEO (score, issues, etc.)' CHECK (json_valid(`seo_data`)),
  `word_count` int(10) UNSIGNED DEFAULT 0 COMMENT 'Número de palabras',
  `status` enum('draft','pending','published','rejected') DEFAULT 'draft' COMMENT 'Estado actual',
  `rejection_reason` text DEFAULT NULL COMMENT 'Motivo del rechazo (si aplica)',
  `created_by` int(10) UNSIGNED NOT NULL COMMENT 'Editor que creó el artículo',
  `website_id` int(10) UNSIGNED DEFAULT NULL COMMENT 'Website al que pertenece el artículo',
  `language` varchar(5) DEFAULT 'es' COMMENT 'Idioma del contenido (es, en, etc.)',
  `content_type` enum('planner','manual','imported') DEFAULT 'planner' COMMENT 'Tipo de contenido',
  `wordpress_post_id` int(10) UNSIGNED DEFAULT NULL COMMENT 'ID del post en WordPress si fue publicado',
  `featured_image_url` varchar(500) DEFAULT NULL COMMENT 'URL de la imagen destacada para WordPress',
  `wordpress_categories` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Categorías seleccionadas para WordPress [{id, name, slug}]' CHECK (json_valid(`wordpress_categories`)),
  `wordpress_status` enum('draft','publish','pending','private','future') DEFAULT 'draft' COMMENT 'Estado de publicación en WordPress',
  `optimization_count` int(10) UNSIGNED DEFAULT 0 COMMENT 'Número de veces que se optimizó',
  `reviewed_by` int(10) UNSIGNED DEFAULT NULL COMMENT 'Admin que revisó',
  `published_by` int(10) UNSIGNED DEFAULT NULL COMMENT 'Admin que publicó',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `submitted_at` timestamp NULL DEFAULT NULL COMMENT 'Fecha de envío para aprobación',
  `reviewed_at` timestamp NULL DEFAULT NULL COMMENT 'Fecha de revisión',
  `published_at` timestamp NULL DEFAULT NULL COMMENT 'Fecha de publicación'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Artículos creados por editores';

--
-- Disparadores `articles`
--
DELIMITER $$
CREATE TRIGGER `before_article_insert` BEFORE INSERT ON `articles` FOR EACH ROW BEGIN
  IF NEW.word_count = 0 OR NEW.word_count IS NULL THEN
    SET NEW.word_count = (LENGTH(NEW.content) - LENGTH(REPLACE(NEW.content, ' ', '')) + 1);
  END IF;
  
  -- Generar slug si no existe
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    SET NEW.slug = LOWER(REPLACE(REPLACE(NEW.title, ' ', '-'), '.', ''));
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_article_update` BEFORE UPDATE ON `articles` FOR EACH ROW BEGIN
  -- Actualizar word_count si el contenido cambió
  IF NEW.content != OLD.content THEN
    SET NEW.word_count = (LENGTH(NEW.content) - LENGTH(REPLACE(NEW.content, ' ', '')) + 1);
  END IF;
  
  -- Actualizar submitted_at cuando cambia a pending
  IF NEW.status = 'pending' AND OLD.status = 'draft' THEN
    SET NEW.submitted_at = NOW();
  END IF;
  
  -- Actualizar reviewed_at cuando cambia de pending
  IF OLD.status = 'pending' AND NEW.status IN ('published', 'rejected') THEN
    SET NEW.reviewed_at = NOW();
  END IF;
  
  -- Actualizar published_at cuando se publica
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    SET NEW.published_at = NOW();
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `article_translations`
--

CREATE TABLE `article_translations` (
  `id` int(10) UNSIGNED NOT NULL,
  `article_id` int(10) UNSIGNED NOT NULL COMMENT 'FK al artículo principal',
  `language` varchar(5) NOT NULL COMMENT 'Código del idioma (es, en, fr, etc.)',
  `title` varchar(255) NOT NULL COMMENT 'Título traducido',
  `h1_title` varchar(255) DEFAULT NULL COMMENT 'Título H1 traducido',
  `keyword` varchar(100) NOT NULL COMMENT 'Palabra clave traducida',
  `objective_phrase` varchar(255) DEFAULT NULL COMMENT 'Frase objetivo traducida',
  `keywords_array` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array de keywords traducidas' CHECK (json_valid(`keywords_array`)),
  `slug` varchar(255) NOT NULL COMMENT 'Slug traducido',
  `content` longtext NOT NULL COMMENT 'Contenido traducido en Markdown',
  `sections_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Estructura de secciones traducidas' CHECK (json_valid(`sections_json`)),
  `meta_description` text DEFAULT NULL COMMENT 'Meta descripción traducida',
  `seo_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Datos SEO de esta traducción' CHECK (json_valid(`seo_data`)),
  `word_count` int(10) UNSIGNED DEFAULT 0 COMMENT 'Número de palabras',
  `wordpress_post_id` int(10) UNSIGNED DEFAULT NULL COMMENT 'ID del post en WordPress si fue publicado',
  `featured_image_url` varchar(500) DEFAULT NULL COMMENT 'URL de la imagen destacada para WordPress',
  `wordpress_categories` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Categorías seleccionadas para WordPress [{id, name, slug}]' CHECK (json_valid(`wordpress_categories`)),
  `wordpress_status` enum('draft','publish','pending','private','future') DEFAULT 'draft' COMMENT 'Estado de publicación en WordPress',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Traducciones de artículos vinculadas al artículo principal';

--
-- Disparadores `article_translations`
--
DELIMITER $$
CREATE TRIGGER `before_translation_insert` BEFORE INSERT ON `article_translations` FOR EACH ROW BEGIN
  IF NEW.word_count = 0 OR NEW.word_count IS NULL THEN
    SET NEW.word_count = (LENGTH(NEW.content) - LENGTH(REPLACE(NEW.content, ' ', '')) + 1);
  END IF;
  
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    SET NEW.slug = LOWER(REPLACE(REPLACE(NEW.title, ' ', '-'), '.', ''));
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_translation_update` BEFORE UPDATE ON `article_translations` FOR EACH ROW BEGIN
  IF NEW.content != OLD.content THEN
    SET NEW.word_count = (LENGTH(NEW.content) - LENGTH(REPLACE(NEW.content, ' ', '')) + 1);
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(50) NOT NULL COMMENT 'Nombre del rol',
  `slug` varchar(50) NOT NULL COMMENT 'Identificador único del rol',
  `description` text DEFAULT NULL COMMENT 'Descripción del rol',
  `hierarchy_level` int(11) NOT NULL DEFAULT 0 COMMENT 'Nivel jerárquico (mayor = más poder)',
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Permisos del rol en formato JSON' CHECK (json_valid(`permissions`)),
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Rol activo/inactivo',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Roles del sistema con jerarquía y permisos';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `username` varchar(50) NOT NULL COMMENT 'Usuario único para login',
  `password` varchar(255) NOT NULL COMMENT 'Password hasheado con bcrypt',
  `role_id` int(10) UNSIGNED NOT NULL DEFAULT 3 COMMENT 'FK a roles (3=editor por defecto)',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Usuario activo/inactivo',
  `created_by` int(10) UNSIGNED DEFAULT NULL COMMENT 'ID del admin que creó este usuario',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT 'Fecha de creación',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Usuarios del sistema (simplificado)';

--
-- Disparadores `users`
--
DELIMITER $$
CREATE TRIGGER `after_user_created` AFTER INSERT ON `users` FOR EACH ROW BEGIN
  -- Puedes registrar en una tabla de eventos
  INSERT INTO api_requests (endpoint, method, status_code, created_at)
  VALUES ('/api/v1/auth/register', 'POST', 201, NOW());
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `token_jti` varchar(100) NOT NULL COMMENT 'JWT ID del access token',
  `ip_address` varchar(45) NOT NULL COMMENT 'IP del usuario',
  `user_agent` text DEFAULT NULL COMMENT 'User agent del navegador',
  `expires_at` timestamp NOT NULL COMMENT 'Fecha de expiración del token',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sesiones activas de usuarios';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_websites`
--

CREATE TABLE `user_websites` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL COMMENT 'ID del usuario (normalmente editor)',
  `website_id` int(10) UNSIGNED NOT NULL COMMENT 'ID del sitio web',
  `assigned_by` int(10) UNSIGNED NOT NULL COMMENT 'Admin que asignó el sitio',
  `assigned_at` timestamp NULL DEFAULT current_timestamp() COMMENT 'Fecha de asignación',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Asignación activa/inactiva'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de relación muchos-a-muchos entre usuarios y sitios web';

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_dashboard_stats`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vw_dashboard_stats` (
`totalUsers` bigint(21)
,`activeUsers` bigint(21)
,`inactiveUsers` bigint(21)
,`recentUsers` bigint(21)
,`totalWebsites` bigint(21)
,`activeWebsites` bigint(21)
,`verifiedWebsites` bigint(21)
,`totalApiCalls` decimal(32,0)
,`totalAIModels` bigint(21)
,`activeAIModels` bigint(21)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `websites`
--

CREATE TABLE `websites` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL COMMENT 'Nombre del sitio web',
  `url` varchar(255) NOT NULL COMMENT 'URL del sitio web',
  `app_password` varchar(255) NOT NULL COMMENT 'Contraseña de aplicación',
  `description` text DEFAULT NULL COMMENT 'Descripción del sitio',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Sitio activo/inactivo',
  `connection_verified` tinyint(1) DEFAULT 0 COMMENT 'Conexión verificada',
  `last_verified_at` timestamp NULL DEFAULT NULL COMMENT 'Última verificación de conexión',
  `last_request_at` timestamp NULL DEFAULT NULL COMMENT 'Última petición recibida',
  `request_count` int(10) UNSIGNED DEFAULT 0 COMMENT 'Contador de peticiones',
  `created_by` int(10) UNSIGNED NOT NULL COMMENT 'Usuario que creó el sitio',
  `updated_by` int(10) UNSIGNED DEFAULT NULL COMMENT 'Usuario que actualizó',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sitios web configurados con contraseñas de aplicación';

--
-- Disparadores `websites`
--
DELIMITER $$
CREATE TRIGGER `after_website_request_update` AFTER UPDATE ON `websites` FOR EACH ROW BEGIN
  IF NEW.request_count > OLD.request_count THEN
    INSERT INTO api_requests (website_id, endpoint, method, status_code, created_at)
    VALUES (NEW.id, 'WordPress API', 'GET', 200, NOW());
  END IF;
END
$$
DELIMITER ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `ai_models`
--
ALTER TABLE `ai_models`
  ADD PRIMARY KEY (`id`),
  ADD KEY `updated_by` (`updated_by`),
  ADD KEY `idx_provider` (`provider`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_created` (`created_at`),
  ADD KEY `idx_ai_models_active` (`is_active`);

--
-- Indices de la tabla `api_requests`
--
ALTER TABLE `api_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_website` (`website_id`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_status` (`status_code`),
  ADD KEY `idx_endpoint` (`endpoint`);

--
-- Indices de la tabla `articles`
--
ALTER TABLE `articles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_keyword` (`keyword`),
  ADD KEY `idx_published_at` (`published_at`),
  ADD KEY `reviewed_by` (`reviewed_by`),
  ADD KEY `published_by` (`published_by`);

--
-- Indices de la tabla `article_translations`
--
ALTER TABLE `article_translations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_article_language` (`article_id`,`language`),
  ADD KEY `idx_article_id` (`article_id`),
  ADD KEY `idx_language` (`language`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_slug` (`slug`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_hierarchy` (`hierarchy_level`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_role_id` (`role_id`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_created` (`created_at`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_users_created_at` (`created_at`),
  ADD KEY `idx_users_active` (`is_active`);

--
-- Indices de la tabla `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token_jti` (`token_jti`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_token` (`token_jti`),
  ADD KEY `idx_expires` (`expires_at`);

--
-- Indices de la tabla `user_websites`
--
ALTER TABLE `user_websites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_website` (`user_id`,`website_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_website_id` (`website_id`),
  ADD KEY `idx_assigned_by` (`assigned_by`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indices de la tabla `websites`
--
ALTER TABLE `websites`
  ADD PRIMARY KEY (`id`),
  ADD KEY `updated_by` (`updated_by`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_connection_verified` (`connection_verified`);

--
-- Indices de la tabla `wordpress_credentials`
--
ALTER TABLE `wordpress_credentials`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_website_credentials` (`user_id`,`website_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_website_id` (`website_id`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_test_status` (`test_status`);

--
-- AUTO_INCREMENT de la tabla `ai_models`
--
ALTER TABLE `ai_models`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `api_requests`
--
ALTER TABLE `api_requests`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `articles`
--
ALTER TABLE `articles`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `article_translations`
--
ALTER TABLE `article_translations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `user_websites`
--
ALTER TABLE `user_websites`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `websites`
--
ALTER TABLE `websites`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `wordpress_credentials`
--
ALTER TABLE `wordpress_credentials`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_dashboard_stats`
--
DROP TABLE IF EXISTS `vw_dashboard_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`jynxntxn`@`localhost` SQL SECURITY INVOKER VIEW `vw_dashboard_stats`  AS SELECT (select count(0) from `users`) AS `totalUsers`, (select count(0) from `users` where `users`.`is_active` = 1) AS `activeUsers`, (select count(0) from `users` where `users`.`is_active` = 0) AS `inactiveUsers`, (select count(0) from `users` where `users`.`created_at` >= current_timestamp() - interval 7 day) AS `recentUsers`, (select count(0) from `websites`) AS `totalWebsites`, (select count(0) from `websites` where `websites`.`is_active` = 1) AS `activeWebsites`, (select count(0) from `websites` where `websites`.`connection_verified` = 1) AS `verifiedWebsites`, (select coalesce(sum(`websites`.`request_count`),0) from `websites`) AS `totalApiCalls`, (select count(0) from `ai_models`) AS `totalAIModels`, (select count(0) from `ai_models` where `ai_models`.`is_active` = 1) AS `activeAIModels` ;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `ai_models`
--
ALTER TABLE `ai_models`
  ADD CONSTRAINT `ai_models_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ai_models_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `wordpress_credentials`
--

CREATE TABLE `wordpress_credentials` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL COMMENT 'ID del usuario',
  `website_id` int(10) UNSIGNED NOT NULL COMMENT 'ID del sitio web',
  `username` varchar(100) NOT NULL COMMENT 'Nombre de usuario de WordPress',
  `app_password` varchar(255) NOT NULL COMMENT 'Contraseña de aplicación encriptada',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Credenciales activas/inactivas',
  `last_tested` timestamp NULL DEFAULT NULL COMMENT 'Última vez que se probó la conexión',
  `test_status` enum('success','failed','pending') DEFAULT 'pending' COMMENT 'Estado de la última prueba',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Credenciales de WordPress por usuario y sitio web';

--
-- Filtros para la tabla `api_requests`
--
ALTER TABLE `api_requests`
  ADD CONSTRAINT `fk_api_requests_website` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `articles`
--
ALTER TABLE `articles`
  ADD CONSTRAINT `articles_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `articles_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `articles_ibfk_3` FOREIGN KEY (`published_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `article_translations`
--
ALTER TABLE `article_translations`
  ADD CONSTRAINT `fk_translation_article` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

--
-- Filtros para la tabla `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_websites`
--
ALTER TABLE `user_websites`
  ADD CONSTRAINT `fk_user_websites_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_user_websites_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_user_websites_website` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `websites`
--
ALTER TABLE `websites`
  ADD CONSTRAINT `websites_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `websites_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `wordpress_credentials`
--
ALTER TABLE `wordpress_credentials`
  ADD CONSTRAINT `fk_wordpress_credentials_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_wordpress_credentials_website` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
