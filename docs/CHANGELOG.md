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
- `CLAUDE.md` en la raíz: guía de arquitectura, comandos y protocolo de documentación
  para agentes Claude Code.
- Validación de estados permitidos por entidad en los endpoints `PATCH .../estado`
  (`Busca ocupante` / `Ya fue ocupada` y `Buscando alojamiento` / `Ya encontró alojamiento`).

### Cambiado
- `docker-compose.yml`: todas las credenciales ahora se leen desde variables de entorno
  (`${POSTGRES_USER}`, `${POSTGRES_PASSWORD}`, `${ADMIN_PASSWORD}`, etc.) en lugar de
  valores hardcodeados. Compatible con Railway, Render, Fly.io y cualquier PaaS.
  `ADMIN_PASSWORD` usa además la sintaxis `${VAR:?mensaje}` para fallar de inmediato con
  una explicación si no está definida, en vez de propagar una cadena vacía al contenedor.
- `.env.example`: actualizado con todos los campos requeridos, incluyendo `POSTGRES_USER`,
  `POSTGRES_PASSWORD`, `POSTGRES_DB`, comentarios de guía para despliegue, el uso de
  `?sslmode=require` en proveedores gestionados y cómo generar una clave admin fuerte.
- **PostgreSQL es obligatorio en producción** (ADR-007). Con `NODE_ENV=production`, la app
  ya no cae a SQLite: falla al arrancar con un mensaje explícito y `exit(1)`. En desarrollo
  el fallback sigue igual.
- `toggleEstadoVivienda()` y `toggleEstadoNecesidad()` muestran el error del servidor y los
  fallos de red mediante `showToast`, en vez de fallar en silencio.

### Corregido
- **BUG-001**: el fallback silencioso a SQLite hacía que la plataforma perdiera todos los
  registros en cada reinicio del contenedor, sin ningún error visible.
- **BUG-004**: el botón "Cambiar Estado" no daba ninguna señal cuando la operación fallaba.
- **BUG-005**: typo en `GET /api/stats` (`parseIntnecesidades`) que creaba una variable global
  implícita. Funcionaba en modo *sloppy*, pero habría lanzado `ReferenceError` en modo estricto
  o al migrar a ESM, tumbando el contador del banner principal.

### Eliminado
- Valor por defecto `admin123` de `ADMIN_PASSWORD` en `entrypoint.sh` y `docker-compose.yml`.

### Seguridad
- **CRÍTICO**: eliminadas credenciales de producción hardcodeadas en `docker-compose.yml`.
  `ADMIN_PASSWORD=admin123` ya no está en el código fuente del repositorio.
- **BUG-002**: en producción se rechaza el arranque si `ADMIN_PASSWORD` falta, mide menos de
  12 caracteres o es una clave débil conocida. Complementa el punto anterior: quitarla del
  repositorio evita filtrarla, y esta validación evita desplegar sin haberla definido.
- **BUG-003**: `PATCH /api/viviendas/:id/estado` y `PATCH /api/necesidades-vivienda/:id/estado`
  exigen ahora el `owner_token` del autor (o la clave admin vía `x-admin-key`). Antes cualquiera
  podía cambiar el estado de cualquier registro y vaciar los listados.
- **BUG-003**: los cinco listados públicos dejan de exponer el `owner_token` de los registros
  (nuevo helper `sinDatosPrivados()`). Antes viajaba al cliente en cada `GET`, permitiendo
  suplantar al autor de cualquier publicación.

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
