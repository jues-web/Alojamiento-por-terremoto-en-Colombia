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
- **Panel de Administración**: Se incorporaron las tablas de Centros de Acopio, Refugios de Mascotas y Necesidades de Mascotas al panel de moderación, ya que anteriormente sólo se visualizaban Viviendas y Necesidades de Vivienda.
- **Panel de Administración**: Nueva sección de **Control de IPs**, donde el administrador puede visualizar las IPs que han interactuado con la plataforma, desbloquearlas manualmente ("Permitir publicar") o bloquearlas definitivamente.

### Seguridad
- **Rate Limiting Persistente por IP**: Se modificó el sistema de detección de anomalías para que use la base de datos (`ip_registry`) en lugar de memoria volatil. Ahora, se permite un máximo de 10 publicaciones por IP antes de bloquear temporalmente a la IP y ponerla bajo revisión. Un administrador autenticado no tiene límite de publicaciones.

### Cambiado
- `CLAUDE.md` en la raíz: guía de arquitectura, comandos y protocolo de documentación
  para agentes Claude Code.
- Helper `enviarFormulario()` en `public/app.js`, compartido por los cinco formularios de
  registro: bloquea el botón durante el envío (con estado "Enviando..."), distingue los
  fallos de red de los errores del servidor y muestra el mensaje adecuado en cada caso.
- **`GET /api/viviendas/:id/foto`**: sirve la foto de una vivienda como WebP binario, con
  caché de un año (`immutable`). Devuelve 404 si la vivienda no tiene foto, no existe o
  está en cuarentena (ADR-008).
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
- ⚠️ **PostgreSQL es obligatorio siempre**, también en desarrollo (ADR-009). `DATABASE_URL`
  pasa a ser requerida: sin ella la app no arranca y explica las dos vías de desarrollo
  local (`docker compose up -d db`, o una rama de Neon con `?sslmode=require`).
  Esto sustituye a la restricción que el ADR-007 aplicaba sólo a producción.
- Las 27 consultas de `server/index.js` usan placeholders nativos de PostgreSQL
  (`$1, $2…`) en lugar de los `?` heredados de SQLite. `query()` queda como una envoltura
  fina sobre `pgPool.query()`, sin reescribir el SQL.
- `toggleEstadoVivienda()` y `toggleEstadoNecesidad()` muestran el error del servidor y los
  fallos de red mediante `showToast`, en vez de fallar en silencio.
- ⚠️ **Cambio incompatible**: `GET /api/viviendas` ya **no** devuelve el campo `imagen_base64`.
  Antes embebía el data URI completo de cada foto en el JSON (~616 KB por vivienda medidos),
  lo que hacía que la pestaña "Dónde Alojarse" descargara varios MB de golpe en dispositivos
  con datos limitados (MUST-HAVE #5 del Project Brief). Las fotos se piden ahora una a una
  por `GET /api/viviendas/:id/foto`, y sólo cuando entran en pantalla (`loading="lazy"`).
  El campo `foto_id` indica si hay imagen que pedir. Ver ADR-008.

- **BUG-006**: Corrección en la entrega y visualización de imágenes de viviendas y habitaciones. Se actualizó la consulta SQL en `GET /api/viviendas` con `COALESCE(v.foto_id, f.id) AS foto_id` y `LEFT JOIN foto f ON (v.foto_id = f.id OR f.vivienda_id = v.id)` para vincular correctamente fotos existentes. Además en `public/app.js` se implementó `getPlaceholderImg(tipo)` para renderizar ilustraciones SVG vectoriales cuando la vivienda no posea foto personalizada o falle la carga en red.

### Corregido
- **BUG-007**: Validación de teléfono defectuosa que aceptaba 11 o 12 dígitos en todos los
  formularios de registro. Se corrigió `isValidPhone()` en `server/index.js` para exigir
  entre 7 y 10 dígitos (celulares y fijos en Colombia). Se agregó `maxlength="10"` a los inputs
  del frontend en `public/app.js` como protección UI inmediata.
- **BUG-006**: HTTP 429 en todas las rutas `/api/` bloqueaba la navegación normal. Dos causas
  raíz corregidas en `5e7e6da`: (1) `generalLimiter` subió de 300 a 1000 req/15min y se
  excluyeron las rutas de foto con `skip`; se añadió `app.set('trust proxy', 1)` para que
  Express no agrupe a todos los usuarios detrás de Docker/nginx como una sola IP; nuevo
  `authLimiter` (15 intentos/15min) exclusivo para `POST /api/admin/login`. (2) El frontend
  descartaba silenciosamente errores HTTP: `fetchAdminData` ahora limpia sesión en 401/403,
  muestra mensaje en 429 y nunca deja el panel en blanco; `renderAlojamientos`,
  `renderNecesidades` y `renderMascotas` comprueban `res.ok` antes de llamar a `.json()`;
  `loginAdmin`, `adminEliminar` y `adminAprobar` notifican errores de red mediante `showToast`.
- **BUG-001**: el fallback silencioso a SQLite hacía que la plataforma perdiera todos los
  registros en cada reinicio del contenedor, sin ningún error visible.
- **BUG-004**: el botón "Cambiar Estado" no daba ninguna señal cuando la operación fallaba.
- **BUG-005**: typo en `GET /api/stats` (`parseIntnecesidades`) que creaba una variable global
  implícita. Funcionaba en modo *sloppy*, pero habría lanzado `ReferenceError` en modo estricto
  o al migrar a ESM, tumbando el contador del banner principal.
- **BUG-K001**: los cinco formularios de registro no daban feedback útil ante una caída de red
  (mostraban el texto crudo del navegador en inglés) y tres de ellos ocultaban el mensaje de
  validación del servidor tras un genérico "Error al guardar". Además, sin bloqueo del botón,
  el usuario con conexión lenta pulsaba varias veces y su propio registro acababa en cuarentena
  por la detección de ráfagas.

### Eliminado
- Valor por defecto `admin123` de `ADMIN_PASSWORD` en `entrypoint.sh` y `docker-compose.yml`.
- **Motor SQLite y su fallback automático** (ADR-009). Se eliminan `createSqliteTables()`,
  la rama SQLite de `query()` y la dependencia `sqlite3` (122 paquetes menos). El esquema
  deja de estar duplicado a mano y desaparece la traducción de placeholders `?` → `$1`,
  cuyo `replace` global habría roto cualquier consulta con un `?` dentro de un literal.

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
