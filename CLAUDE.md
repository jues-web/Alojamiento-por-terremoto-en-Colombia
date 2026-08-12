# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> El proyecto, su documentación, los commits y los mensajes de UI están **en español**. Mantener ese idioma en código nuevo, comentarios y commits.

---

## Comandos

```bash
npm install                    # instalar dependencias (node_modules no está versionado)
npm start                      # servidor en :3000 (SQLite si no hay DATABASE_URL)
npm run dev                    # igual, con node --watch

docker compose up --build -d   # stack completo: app + PostgreSQL 16 con healthcheck
docker compose logs -f app
docker compose down -v         # borra también el volumen postgres_data

curl localhost:3000/api/health # healthcheck usado por Docker
node --check server/index.js   # verificación de sintaxis rápida
```

**No hay tests todavía.** `package.json` no define script `test` ni tiene Jest/Supertest instalados. El stack de testing aprobado (Jest o Node Test Runner + Supertest) está declarado en `.agents/workflows/qa-build-workflow.md` pero aún no implementado. Al añadirlo, respetar ese stack: cualquier otra librería requiere un ADR.

**No hay linter, formatter ni build step.** El frontend se sirve tal cual desde `public/`.

---

## Arquitectura

Aplicación monolítica de 3 archivos reales: `server/index.js` (todas las rutas), `server/db.js` (acceso a datos) y `public/app.js` (todo el frontend). Express sirve `public/` como estático y expone `/api/*`.

### `server/db.js` — capa dual PostgreSQL/SQLite

Es la pieza que más condiciona cómo se escribe el resto del código:

- `initDB()` intenta conectar a `DATABASE_URL`; si falla o no existe, cae a SQLite en `data.db` (raíz del repo). El fallback es silencioso, así que un error de credenciales de Postgres se manifiesta como "los datos no persisten" y no como un crash.
- **Todo el SQL se escribe con `?` como placeholder.** `query()` traduce `?` → `$1, $2…` cuando corre en Postgres. Nunca escribir `$1` directamente: rompería SQLite.
- `query()` devuelve un **array de filas** en SELECT. En escrituras devuelve `[]` en Postgres pero `{lastID, changes}` en SQLite — no depender del valor de retorno de INSERT/UPDATE/DELETE.
- Los esquemas están **duplicados a mano** en `createPostgresTables()` y `createSqliteTables()`. Cualquier columna nueva debe agregarse en ambos, con el tipo equivalente (`UUID`/`TEXT`, `BOOLEAN`/`INTEGER`, `TIMESTAMP`/`DATETIME`). No hay sistema de migraciones: las tablas se crean con `CREATE TABLE IF NOT EXISTS` al arrancar, así que **añadir una columna a una BD ya existente no ocurre automáticamente**.

### Modelo de datos

Cinco entidades independientes (sin FKs declaradas) + `foto`:

`vivienda` · `necesidad_vivienda` · `centro_acopio` · `refugio_mascota` · `necesidad_mascota`

Todas comparten el mismo trío de moderación: `owner_token`, `reportes_count`, `sospechoso`. Los endpoints `/api/reportar/:tipo/:id` y `/api/admin/*` usan un `tableMap` que traduce el `:tipo` de la URL a nombre de tabla — es la lista blanca que evita inyección en el nombre de tabla. **Al agregar una entidad hay que añadirla a los tres `tableMap` de `server/index.js`.**

`foto` guarda la imagen como **data URI base64 dentro de la BD** (`imagen_base64 TEXT`), no como archivo. Solo `vivienda` tiene foto, vía `LEFT JOIN foto`.

### Moderación y anti-spam (ADR-005)

Cuatro capas, todas en `server/index.js`:

1. `express-rate-limit` global sobre `/api/` (300 req / 15 min por IP).
2. **Honeypot**: si el body trae `honeypot` con valor, se responde `200 {success:true}` sin guardar nada. El silencio es intencional — no cambiarlo por un error.
3. **Detección de ráfagas** (`detectAnomaly`): >3 envíos en 5 min desde una IP marca el registro con `sospechoso = true`. El estado vive en un `Map` en memoria: se pierde al reiniciar y no se comparte entre instancias.
4. **Reporte comunitario**: 3 reportes → `sospechoso = true` automático.

**Invariante**: todos los GET públicos filtran `WHERE sospechoso = false`. Los registros marcados solo son visibles desde el panel admin, que puede eliminarlos o aprobarlos (`sospechoso = false, reportes_count = 0`).

### Autenticación

- **Autoría**: `owner_token` generado en el cliente y guardado en `localStorage` (ADR-003). No hay cuentas.
- **Admin**: clave maestra única de `ADMIN_PASSWORD` (ADR-004). `POST /api/admin/login` devuelve la propia clave, que el frontend guarda en `localStorage` y reenvía en el header `x-admin-key`; `requireAdmin` la compara. El default `admin123` está hardcodeado como fallback en `server/index.js`, `entrypoint.sh` y `docker-compose.yml` — cualquier despliegue real debe sobrescribirlo.

### Imágenes (ADR-002)

`processImageBuffer()` valida el binario real con `sharp().metadata()` (no la extensión), exige ≥500px por lado, máx 15MB, y produce WebP 720×1008 calidad 82 sin EXIF. El `.rotate()` inicial aplica la orientación de cámara antes del resize. Devuelve el data URI listo para insertar.

### Frontend (`public/`)

Vanilla, sin bundler, sin módulos ES. Consecuencias prácticas:

- **Todas las funciones deben ser globales** — se invocan desde atributos `onclick` en el HTML y en las plantillas de string generadas por JS. Envolver el archivo en un módulo o IIFE rompe toda la UI.
- Los formularios se generan como **strings HTML** en `getForm*HTML()` y se inyectan en el modal. Los datos de la BD se interpolan sin escapar en esos templates (`${v.detalles}` etc.); tenerlo presente al tocar los renders.
- `POST /api/viviendas` es el **único endpoint multipart** (`FormData`, por la foto). Los demás envían JSON.
- Todos los booleanos llegan como strings desde el `<select>`; el servidor normaliza con `condicion_especial === true || === 'true'`.

---

## Protocolo de documentación (obligatorio)

`.agents/AGENTS.md` es la instrucción maestra del repo y aplica a este agente. Resumen operativo:

| Al hacer… | Leer antes | Actualizar después |
|---|---|---|
| Feature | `docs/CHANGELOG.md`, `docs/DECISIONS.md` | `docs/CHANGELOG.md`, `docs/COMMITS.md` |
| Fix de bug | `docs/BUGS.md` | `docs/BUGS.md` (+ tabla de resumen), `docs/COMMITS.md` |
| Refactor / cambio arquitectónico | `docs/DECISIONS.md` | nuevo ADR + `docs/COMMITS.md` |
| QA / auditoría | `.agents/workflows/qa-build-workflow.md`, `docs/BUGS.md` | `docs/BUGS.md`, `docs/COMMITS.md` |

- `docs/COMMITS.md` se actualiza **siempre**, con una fila por commit en la sección de la rama activa.
- Los ADR en `docs/DECISIONS.md` son inmutables: para cambiar una decisión se crea un ADR nuevo que referencia al anterior.
- **Agregar cualquier librería nueva exige un ADR.**
- `docs/origen/` es documentación histórica de solo lectura — no modificar.
- `CHANGELOG.md` en la raíz es un espejo; el canónico es `docs/CHANGELOG.md`.

## Git

Flujo `[rama-persona]` → `dev` → `main` (ADR-006). Nunca commit directo a `main` ni a `dev`. Ramas personales actuales: `juan`, `emmanuel`.

Conventional Commits **en español**: `<tipo>(<scope>): <descripción>`
Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `style`, `merge`, `release`
Scopes: `vivienda`, `mascota`, `admin`, `db`, `auth`, `image`, `api`, `ui`, `docker`, `docs`, `tests`

---

## Producción vs. desarrollo

`server/db.js` y `server/index.js` se comportan distinto según `NODE_ENV=production`:

| | Desarrollo | Producción |
|---|---|---|
| Sin PostgreSQL disponible | fallback a SQLite + warning | **error fatal, `exit(1)`** (ADR-007) |
| `ADMIN_PASSWORD` ausente | default `admin123` + warning | **error fatal, `exit(1)`** |
| `ADMIN_PASSWORD` débil o <12 chars | permitido | **error fatal, `exit(1)`** |

`docker-compose.yml` define `NODE_ENV=production`, así que el stack local también exige ambas cosas: copiar `.env.example` a `.env` antes de `docker compose up`.

Los cinco GET públicos pasan por `sinDatosPrivados()`, que elimina el `owner_token`. **No devolver filas crudas de la BD al cliente**: expondría el token que autoriza a modificar el registro.

## Trampas conocidas

- **CRLF**: todos los archivos usan terminadores CRLF (repo en OneDrive/Windows). `sed -i 's/...$/.../'` falla silenciosamente sin contemplar el `\r`. Las herramientas Edit/Write los preservan correctamente.
- **Modo sloppy**: los archivos son CommonJS sin `'use strict'`, así que una asignación a un identificador no declarado crea una global implícita en vez de fallar (fue BUG-005). No hay linter que lo detecte.
- `docs/BUGS.md` documenta dos bugs conocidos abiertos: falta de feedback ante caída de red en el envío de **formularios** (BUG-K001 — el cambio de estado ya está cubierto) y `pg.Pool` sin reconexión automática tras reinicio de Postgres (BUG-K002).
- `entrypoint.sh` corre `npm ci --only=production` si falta `node_modules`; con `docker compose` la imagen ya las trae del build stage.
- Las fotos viajan como base64 dentro del JSON de `GET /api/viviendas`: ~80 KB por registro en cada carga del listado. Relevante para usuarios con datos móviles limitados.
