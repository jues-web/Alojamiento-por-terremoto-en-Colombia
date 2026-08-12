# Historial de Cambios y Bitácora de Desarrollo (CHANGELOG)

Todas las decisiones de diseño, cambios en el código, correcciones de errores y registros de ejecución del proyecto **Alojamiento por Terremoto en Colombia** quedan documentados en este archivo.

---

## [1.0.0-mvp] - 2026-08-11

### Añadido
- **Estrategia de Ramas Git**: Activación y cambio a la rama de desarrollo `juan` (flujo: `juan` -> `dev` -> `main`).
- **Arquitectura de Base de Datos**: Integración de PostgreSQL 16 Alpine con pool de conexiones (`pg.Pool`) e índices SQL estratégicos para las 6 tablas (`vivienda`, `necesidad_vivienda`, `centro_acopio`, `refugio_mascota`, `necesidad_mascota`, `foto`). Soporte de fallback automático a SQLite local.
- **Contenerización Docker**: Archivos `Dockerfile` (Node.js 20 Alpine multi-stage) y `docker-compose.yml` (servicios `app` y `db` con volumen persistente `postgres_data` y comprobaciones de salud `healthcheck`).
- **Procesamiento de Imágenes con Sharp**: Soporte para 7 formatos (JPEG, PNG, WebP, AVIF, GIF, TIFF), validación de binario real con `sharp(buffer).metadata()`, límite de 15MB, mínimo de 500px, depuración de metadatos EXIF GPS y conversión a WebP (82/100, peso ~40-100 KB).
- **Panel de Administración Secreto (`/admin`)**: Autenticación por clave maestra (`ADMIN_PASSWORD`), permitiendo al equipo de coordinación (Luis Felipe, Emmanuel, Juan Esteban) visualizar, editar, cambiar estados y eliminar cualquier registro.
- **Automatización Anti-Spam & Anomalías**: Middleware de detección de ráfagas masivas (bloqueo automático si se envían > 3 publicaciones en 5 min o envíos simultáneos), honeypots invisibles y sistema de reporte comunitario (marcado a revisión con 3 reportes).
- **Diseño Responsivo Universal**: Interfaz web mobile-first basada en `diseñoAplicacionWeb.html` adaptada a Smartphones (<640px), Tablets (640-1024px) y PCs (>1024px).
- **Control de Autoría sin SMS**: Guardado de `owner_token` en `localStorage` del navegador para permitir al creador editar o marcar su registro como "Ocupado / Resuelto" desde su propio celular.
- **Workflow de QA (.agents/workflows/qa-build-workflow.md)**: Guía de 6 fases secuenciales para auditorías, testing y despliegue.

### Errores y Bugs Corregidos
- *Ningún bug reportado a la fecha.*
