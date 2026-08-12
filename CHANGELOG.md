# CHANGELOG

> ⚠️ **Este archivo es solo una referencia histórica del MVP inicial.**
>
> El changelog oficial y activo del proyecto está en:
> **[`docs/CHANGELOG.md`](./docs/CHANGELOG.md)**
>
> Los agentes y el equipo deben editar ÚNICAMENTE `docs/CHANGELOG.md`.

---

## [1.0.0-mvp] — 2026-08-11 *(Registro histórico inicial)*

### Añadido
- Estrategia de Ramas Git: `juan` → `dev` → `main`.
- Arquitectura de Base de Datos: PostgreSQL 16 Alpine con `pg.Pool` e índices SQL, fallback a SQLite.
- Contenerización Docker: `Dockerfile` (Node.js 20 Alpine) y `docker-compose.yml`.
- Procesamiento de Imágenes: Sharp (WebP 82/100, sin EXIF, 15MB max, 500px min).
- Panel de Administración `/admin`: clave maestra, CRUD completo de registros.
- Anti-Spam: rate limiting, detección de ráfagas (>3 en 5 min), honeypots, cuarentena.
- Diseño Responsivo Mobile-First (<640px, 640-1024px, >1024px).
- Control de Autoría: `owner_token` UUID en `localStorage`.
- Workflow de QA (`.agents/workflows/qa-build-workflow.md`): 6 fases secuenciales.

### Errores y Bugs Corregidos
- *Ningún bug reportado a la fecha. Ver [`docs/BUGS.md`](./docs/BUGS.md) para el registro oficial.*
