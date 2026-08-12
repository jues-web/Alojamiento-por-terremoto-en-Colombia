# 📦 CHANGELOG.md — Historial de Versiones
# Proyecto: Alojamiento por Terremoto en Colombia
# Formato: Keep a Changelog (https://keepachangelog.com/es-ES/1.0.0/)
# Versionado: Semantic Versioning (https://semver.org/lang/es/)

> **INSTRUCCIÓN PARA AGENTES**:
> - Leer este archivo ANTES de cualquier cambio que afecte features, API o UI.
> - Después de un cambio: agregar la entrada bajo `[Unreleased]` en la subsección correcta.
> - En un release: renombrar `[Unreleased]` a la nueva versión y fecha, y crear un nuevo `[Unreleased]` vacío.
> - **Nunca** eliminar entradas históricas.

---

## [Unreleased]

### Añadido
*(Aquí van los próximos cambios que aún no tienen versión)*

### Cambiado

### Corregido

### Eliminado

### Seguridad

---

## [1.0.0] — 2026-08-12

### Añadido
- **Sistema de documentación de control de cambios**: Creación de `docs/COMMITS.md`,
  `docs/BUGS.md`, `docs/DECISIONS.md`, `docs/CHANGELOG.md` y `.agents/AGENTS.md` con
  instrucciones para agentes IA, protocolos de registro y tabla de decisión por tipo de tarea.
- **Estrategia de Ramas Git**: Activación y configuración de 4 ramas: `main` (producción),
  `dev` (integración), `juan` y `emmanuel` (desarrollo personal). Flujo: `[rama-persona]` → `dev` → `main`.
- **Arquitectura de Base de Datos**: PostgreSQL 16 Alpine con `pg.Pool`, índices SQL estratégicos
  para 6 tablas (`vivienda`, `necesidad_vivienda`, `centro_acopio`, `refugio_mascota`,
  `necesidad_mascota`, `foto`). Fallback automático a SQLite.
- **Contenerización Docker**: `Dockerfile` (Node.js 20 Alpine) y `docker-compose.yml`
  (servicios `app` + `db` con volumen persistente y `healthcheck`).
- **Procesamiento de Imágenes con Sharp**: 7 formatos soportados, validación binaria real,
  límite 15MB, mínimo 500px, eliminación EXIF GPS, conversión a WebP (82/100, ~40-100 KB).
- **Panel de Administración `/admin`**: Autenticación por clave maestra (`ADMIN_PASSWORD`),
  CRUD completo de registros, cambio de estados y gestión de cuarentena.
- **Automatización Anti-Spam**: Rate limiting, detección de ráfagas (>3 envíos en 5 min),
  honeypots invisibles y sistema de reporte comunitario (3 reportes → cuarentena).
- **Control de Autoría**: `owner_token` UUID en `localStorage` para edición sin cuenta.
- **Diseño Responsivo**: Mobile-first para <640px, 640-1024px y >1024px.
- **Workflow de QA** (`.agents/workflows/qa-build-workflow.md`): 6 fases secuenciales.

### Seguridad
- Eliminación automática de metadatos EXIF GPS en fotos subidas.
- Validación binaria de imágenes (previene executables disfrazados).
- Clave admin exclusiva en variable de entorno (nunca en código cliente).
- Prevención de inyección SQL con consultas parametrizadas (`$1, $2`).

---

## [0.1.0] — 2026-08-11

### Añadido
- Documentación de arquitectura inicial: PRD, Project Brief, modelo de datos, historias
  de usuario y diseño de aplicación web (`docs/origen/`).
- Estructura base del repositorio con `.gitignore`, `package.json` y configuración inicial.

---

## 🏷️ Leyenda de Tipos de Cambio

| Sección | Descripción |
|---------|-------------|
| `Añadido` | Nuevas funcionalidades |
| `Cambiado` | Cambios en funcionalidades existentes |
| `Corregido` | Correcciones de bugs |
| `Eliminado` | Funcionalidades eliminadas |
| `Seguridad` | Correcciones de vulnerabilidades |
