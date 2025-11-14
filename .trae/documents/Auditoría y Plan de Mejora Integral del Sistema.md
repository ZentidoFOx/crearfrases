## Resumen Ejecutivo
- El sistema combina un frontend Next.js (App Router) y un backend PHP con arquitectura MVC ligera y middleware JWT; existen buenas prácticas (PDO preparado, BCRYPT, CORS configurable, índices en BD), pero hay riesgos críticos: secretos y credenciales hardcodeados, flujo de refresh token roto, falta de rate limiting en login, validaciones desalineadas y posible XSS en el editor.
- La organización de archivos presenta duplicados y mezclas de estilos en el backend; en el frontend hay oportunidad de mejorar rendimiento (imágenes, división de código) y seguridad (sanitización HTML).

## Arquitectura del Sistema
- Frontend: App Router en `app/**`, servicios en `lib/api/**`, contextos en `contexts/**`, UI en `components/**`, rutas API internas en `app/api/*` para IA y streaming.
- Backend PHP: entrada en `backend-php/public/index.php`, ruteo en `backend-php/src/Routes/api.php` y `backend-php/src/Router.php`, controladores en `backend-php/src/Controllers/**`, modelos en `backend-php/src/Models/**`, middleware en `backend-php/src/Middleware/**`, utilidades en `backend-php/src/Utils/**`.
- Config y datos: `backend-php/config/{app.php,database.php}` y esquema con índices y claves foráneas en `backend-php/database/schema.sql`.

## Código Backend (PHP)
- Autenticación JWT:
  - Secreto hardcodeado en `backend-php/config/app.php:11`; comentarios de expiración inconsistentes (`86400` etiquetado como "1 hour" cuando es 24h) `backend-php/config/app.php:12`.
  - Verificación y creación en `backend-php/src/Utils/JWT.php` (HS256); faltan claims estándar (`iss`,`aud`) y validación estricta de `alg`.
- Sesiones y refresh:
  - `user_sessions` gestiona `token_jti` `backend-php/database/schema.sql:251-259`.
  - `AuthController::refresh` referencia `findByRefreshJti`, pero el modelo no lo soporta actualmente (flujo de refresh inoperante).
- Rate limiting:
  - Infraestructura en `backend-php/src/Utils/RateLimiter.php` y configuración en `backend-php/config/app.php:33-37`.
  - Aplicado en registro, no en login (riesgo de fuerza bruta).
- Validación:
  - `UserValidator::validateLogin` espera `email`, mientras `AuthController::login` usa `username` (inconsistencia funcional).
- Base de datos:
  - Credenciales hardcodeadas `backend-php/config/database.php:5-10`.
  - Conexión segura (errores por excepción, `EMULATE_PREPARES=false`) `backend-php/config/database.php:12-15`.
  - Índices bien definidos para rendimiento y consultas `backend-php/database/schema.sql:331-446`.

## Interfaz Frontend
- Enrutamiento y protección:
  - Middleware de autenticación por cookie `middleware.ts:30-51` y matcher `middleware.ts:57-68`.
- Data fetching y estado:
  - Servicios centralizados con `API_CONFIG` `lib/config/api.ts:12-115`; token en header y cookie.
  - Estado global por Context; sin caching de datos (SWR/React Query).
- Seguridad UI:
  - Editor WYSIWYG convierte Markdown/HTML y escribe directamente en `innerHTML` `components/editor/wysiwyg-editor.tsx:101-128,341-367`; usa `rehypeRaw` `components/editor/wysiwyg-editor.tsx:71-75` sin sanitización (riesgo XSS).
- Rendimiento:
  - `next.config.mjs` desactiva optimización de imágenes (unoptimized) y uso mixto de `<img>`/`next/image` en vistas.
  - No se observan `next/dynamic` para dividir componentes grandes.

## Flujos de Datos
- Mapeo frontend→backend:
  - Endpoints `api/v1` cubiertos por servicios en `lib/api/*` (auth, users, websites, ai-models, dashboard, articles).
  - Rutas IA se consumen vía API de Next (`/api/ai/*`) en lugar de PHP directo.
  - Roles usan rutas no versionadas (`/api/roles`) fuera de `api.php` (dos enfoques coexistentes).
- Autenticación:
  - Header `Authorization` y cookie `access_token`; múltiples servicios usan `credentials:'include'` (requiere CORS preciso).
- Posible doble llamada:
  - `websitesService.getOne` dispara `increment-request` tras cada GET, aumentando latencia en detalle de sitio.

## Seguridad
- Secretos y credenciales:
  - JWT secret y credenciales de DB en repositorio (`app.php`, `database.php`).
- Autenticación:
  - Falla en `refresh` y falta de rate limit en login.
- CORS/CSRF:
  - CORS configurable; evitar `*` si `credentials:true`. CSRF no aplica si solo se usa header Bearer; revisar si hay `credentials:'include'` desde frontend.
- XSS:
  - Editor WYSIWYG inserta HTML sin sanitización; `rehypeRaw` habilita HTML bruto.

## Rendimiento
- Backend:
  - BD con índices adecuados; triggers calculan `word_count` y timestamps (coste moderado). Vista `vw_dashboard_stats` usa subconsultas; con índices, aceptable.
- Frontend:
  - Imágenes sin optimización nativa; falta de división de código y caching; streaming SSE bien implementado pero CPU intensivo en el cliente bajo múltiples streams.

## Posibles Cuellos de Botella
- Doble petición en detalle de sitio por incremento automático.
- Streams de IA con bucles de parsing en cliente (`lib/api/ai-service.ts`), potencial saturación si se paraleliza.
- Cálculos en `TranslatorService` sobre textos largos (limpieza y validaciones repetitivas).
- `rolesService.getUserPermissions` sin cache, invocado en checks frecuentes.

## Estructura de Archivos y Organización
- Duplicados y legados:
  - `components/auth/ProtectedRoute.tsx` vs `components/auth/protected-route.tsx`.
  - `components/contenido/planner/parts/step3/index-old.tsx`, backups en `content-search-api/*`.
  - Controladores/modelos "simplified" junto a versiones actuales en backend; mezcla de `backend-php/middleware` y `backend-php/src/Middleware`.
- Recomendación de estructura:
  - Backend PSR-4 con un único árbol bajo `src/**`; mover roles y middlewares legacy; unificar routing.
  - Frontend: separar UI/hooks/utils por carpeta, consolidar documentación bajo `docs/**`.

## Recomendaciones Priorizadas
- Críticas (Seguridad):
  - Mover secretos (JWT, DB) a variables de entorno; cargar con `getenv`/`$_ENV`.
  - Corregir y completar flujo de refresh: persistir `refresh_jti` y validar sesión; añadir rate limit en login.
  - Unificar validación de login (`username` vs `email`) y esquema.
  - Integrar sanitización HTML (`DOMPurify`/`sanitize-html`) en el editor y revisar `rehypeRaw`.
- Arquitectura/Organización:
  - Adoptar autoload PSR-4 con `composer.json`; eliminar duplicados/legados; unificar `api/roles` dentro de `api.php`.
  - Estandarizar casing y nombres en frontend; reubicar documentación.
- Rendimiento:
  - Activar optimización de imágenes y usar `next/image`; introducir `next/dynamic` en componentes pesados; añadir caching (SWR/React Query) para roles/estadísticas.
  - Evitar doble llamada en detalle de sitio; evaluar contador asíncrono o batching.
- Observabilidad:
  - Aprovechar `api_requests` para trazabilidad; instrumentar tiempos en backend; logs estructurados.

## Plan de Implementación por Fases

### Fase 1: Seguridad y Estabilidad
- Backend: leer `JWT_SECRET`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` desde entorno; validar ausencia en repo.
- Arreglar `refresh`: añadir `refresh_jti` en `user_sessions`, implementar `findByRefreshJti`, rotación segura de tokens.
- Aplicar rate limiting en `AuthController::login` y bloquear tras X intentos (`config.app.security`).
- Unificar `username/email`: decidir campo de login (sugerido `username`) y alinear validator y modelos.

### Fase 2: Organización del Backend
- Consolidar `src/Middleware` y `src/Models`; migrar `backend-php/middleware/*` y `backend-php/models/*` a `src/**`.
- Eliminar `*_simplified.php` o mover a `tests/fixtures`.
- Integrar `api/roles.php` en `src/Routes/api.php` para un solo sistema de routing.
- Añadir `composer.json` y autoload PSR-4 (`App\\`), namespaces consistentes.

### Fase 3: Seguridad del Frontend
- Integrar sanitización en editor: aplicar `DOMPurify.sanitize` antes de escribir `innerHTML`; revisar uso de `rehypeRaw`.
- Evitar `dangerouslySetInnerHTML` salvo contenido controlado; encapsular estilos de `chart.tsx`.

### Fase 4: Rendimiento del Frontend
- Activar optimización de imágenes y usar `next/image` en listados/vistas ricas.
- Introducir `next/dynamic`/`React.lazy` en componentes voluminosos (editor, tablas del dashboard, planner step3).
- Adoptar SWR/React Query para caching con `stale-while-revalidate` en roles, stats, websites.

### Fase 5: Flujos de Datos y Latencia
- Revisar `increment-request` para que no duplique llamada en `getOne`; mover incremento a eventos reales o batch.
- Cachear permisos de usuario en cliente y/o backend; reducir llamadas repetidas.
- Unificar rutas `roles` bajo versión `v1`.

### Fase 6: Observabilidad y Pruebas
- Backend: logging estructurado y métricas (tiempo de respuesta, errores) usando `Logger` y tabla `api_requests`.
- Tests: unitarios de utilidades (JWT, Security), integración de controladores clave (Auth, Websites), e2e básicos en frontend (login, navegación, editor).

Si apruebas este plan, procedo a preparar los cambios y parches específicos por fase, empezando por Seguridad (Fase 1).