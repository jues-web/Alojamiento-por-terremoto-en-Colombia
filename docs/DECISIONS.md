# 🏛️ DECISIONS.md — Decisiones Arquitectónicas (ADR)
# Proyecto: Alojamiento por Terremoto en Colombia

> **INSTRUCCIÓN PARA AGENTES**:
> - Antes de cambiar el stack, una librería o una decisión de diseño: leer este archivo.
> - Si se toma una nueva decisión arquitectónica: agregar un ADR al final con el número
>   consecutivo siguiendo el formato exacto de abajo.
> - No se puede modificar un ADR existente. Si se rechaza o cambia, crear uno nuevo
>   que referencia al anterior.

---

## 📌 FORMATO DE ENTRADA (ADR)

```markdown
## ADR-XXX — Título de la decisión

- **Fecha**: YYYY-MM-DD
- **Estado**: ✅ Aceptado | ⏳ Propuesto | ❌ Rechazado | 🔄 Reemplazado por ADR-YYY
- **Autor(es)**: Nombre(s)
- **Rama**: `juan` / `dev` / `main`

### Contexto
¿Por qué se necesitaba tomar esta decisión? ¿Cuál era el problema?

### Opciones consideradas
1. Opción A — ventajas / desventajas
2. Opción B — ventajas / desventajas

### Decisión
¿Qué se eligió y por qué?

### Consecuencias
¿Qué implica esta decisión? ¿Qué deuda técnica genera?
```

---

## ADR-001 — Base de Datos: PostgreSQL con fallback a SQLite

- **Fecha**: 2026-08-11
- **Estado**: ✅ Aceptado
- **Autor(es)**: Juan Esteban Botero Sánchez
- **Rama**: `juan`

### Contexto
El proyecto necesita una base de datos que pueda funcionar tanto en producción
(servidor con Docker) como en desarrollo local sin Docker.

### Opciones consideradas
1. **Solo SQLite** — simple, sin dependencias de red. Pero no escala ni soporta concurrencia real.
2. **Solo PostgreSQL** — robusto, pero requiere Docker o servidor configurado para desarrollo.
3. **PostgreSQL con fallback automático a SQLite** — lo mejor de ambos mundos.

### Decisión
Se usa `pg.Pool` para PostgreSQL como base de datos principal. El archivo `server/db.js`
detecta si la variable de entorno `DATABASE_URL` está disponible; si no, usa SQLite local.

### Consecuencias
- Desarrollo local es inmediato sin necesitar Docker.
- Producción usa PostgreSQL con índices optimizados.
- La deuda técnica es que SQLite y PostgreSQL tienen diferencias sutiles en tipos de datos
  y funciones SQL que podrían causar bugs edge-case al cambiar entre ellos.

---

## ADR-002 — Procesamiento de imágenes: Sharp (WebP 82/100)

- **Fecha**: 2026-08-11
- **Estado**: ✅ Aceptado
- **Autor(es)**: Juan Esteban Botero Sánchez
- **Rama**: `juan`

### Contexto
Los usuarios deben poder subir fotos de viviendas y mascotas. Las imágenes crudas
son pesadas (varios MB) y pueden contener metadatos EXIF con coordenadas GPS (riesgo de privacidad).

### Opciones consideradas
1. **Guardar imagen cruda** — sin procesamiento. Riesgo de privacidad y almacenamiento pesado.
2. **Jimp** — pure JS, lento para imágenes grandes.
3. **Sharp** — nativo, ultra rápido, elimina EXIF, convierte a WebP.

### Decisión
Se usa Sharp con conversión forzada a WebP (calidad 82/100), eliminación de metadatos
EXIF GPS, validación binaria real (`sharp(buffer).metadata()`), límite de 15MB, mínimo 500px.

### Consecuencias
- Fotos pesan entre 40-100KB (vs varios MB originales).
- Se eliminan coordenadas GPS automáticamente.
- No se aceptan archivos que no sean imágenes reales (aunque tengan extensión `.jpg`).

---

## ADR-003 — Autenticación de creador: owner_token en localStorage

- **Fecha**: 2026-08-11
- **Estado**: ✅ Aceptado
- **Autor(es)**: Juan Esteban Botero Sánchez
- **Rama**: `juan`

### Contexto
Los usuarios deben poder editar o marcar su propio registro (vivienda, mascota) sin
necesitar crear una cuenta ni verificar email o número de celular. El contexto es una
emergencia de terremoto donde la fricción debe ser mínima.

### Opciones consideradas
1. **Sistema de cuentas con email/SMS** — seguro pero con demasiada fricción.
2. **Solo IP** — no funciona si el usuario cambia de red (celular a WiFi).
3. **Token UUID en localStorage** — sin cuenta, sin SMS, funciona desde el mismo dispositivo.

### Decisión
Al crear un registro, el servidor genera un `owner_token` UUID y lo devuelve al cliente.
El frontend lo guarda en `localStorage` del navegador. Para editar o cambiar estado, el
cliente envía ese token y el servidor verifica que coincida con el `owner_token` en BD.

### Consecuencias
- Sin fricción para el usuario final.
- Si el usuario borra caché o cambia de dispositivo, pierde control de su registro.
  (El panel de admin puede modificarlo manualmente en ese caso).
- No es un sistema de autenticación robusto, pero es apropiado para el contexto de emergencia.

---

## ADR-004 — Panel Admin: autenticación por clave maestra única

- **Fecha**: 2026-08-11
- **Estado**: ✅ Aceptado
- **Autor(es)**: Juan Esteban Botero Sánchez
- **Rama**: `juan`

### Contexto
El equipo coordinador (Luis Felipe, Emmanuel, Juan Esteban) necesita poder ver, editar
y eliminar cualquier registro sin restricciones.

### Opciones consideradas
1. **OAuth / JWT multi-usuario** — demasiado complejo para MVP.
2. **Clave maestra compartida** — simple, efectiva para un equipo pequeño de confianza.

### Decisión
Existe un endpoint `/api/admin/login` que verifica la variable de entorno `ADMIN_PASSWORD`.
La ruta `/admin` en el frontend solo es funcional con esa clave. La clave NUNCA debe
aparecer en el código fuente ni en el frontend JS.

### Consecuencias
- Fácil de usar para el equipo.
- Si la clave se filtra, cualquiera tiene acceso total. Proteger `.env` a toda costa.
- No hay auditoría de acciones por usuario admin (quién hizo qué acción no queda registrado
  a nivel de BD — solo en los commits y en este documento).

---

## ADR-005 — Anti-spam: detección de ráfagas y honeypots

- **Fecha**: 2026-08-11
- **Estado**: ✅ Aceptado
- **Autor(es)**: Juan Esteban Botero Sánchez
- **Rama**: `juan`

### Contexto
En situaciones de desastre, plataformas similares han sido atacadas con registros falsos
masivos. Se necesita protección sin captchas (demasiada fricción para personas en emergencia).

### Opciones consideradas
1. **reCAPTCHA** — efectivo pero requiere Google account y JavaScript pesado.
2. **Rate limiting simple** — bloquea por IP pero fácil de evadir con proxies.
3. **Rate limiting + honeypots + detección de ráfagas** — multicapa, sin fricción para usuarios reales.

### Decisión
Combinación de tres capas:
1. `express-rate-limit` por IP.
2. Honeypot: campo de formulario invisible para bots (`<input name="website" style="display:none">`).
3. Detección de ráfagas: más de 3 publicaciones en 5 minutos → bloqueo automático y cuarentena admin.

### Consecuencias
- Usuarios normales no notan ninguna protección.
- Bots simples son bloqueados por honeypot.
- Bots sofisticados son bloqueados por detección de ráfagas.
- El equipo admin puede revisar registros en cuarentena.

---

## ADR-006 — Estrategia de ramas: main / dev / [personas]

- **Fecha**: 2026-08-12
- **Estado**: ✅ Aceptado
- **Autor(es)**: Juan Esteban Botero Sánchez
- **Rama**: `juan`

### Contexto
El equipo tiene 3 personas (Juan Esteban, Emmanuel, Luis Felipe) trabajando en el mismo
repositorio. Se necesita una estrategia de ramas que evite conflictos y proteja producción.

### Decisión
Flujo `[rama-persona]` → `dev` → `main`:
- `main`: solo releases probados. Nadie hace commit directo.
- `dev`: integración continua. Solo merges desde ramas personales.
- `juan`, `emmanuel`, `[nombre]`: trabajo diario de cada persona.

### Consecuencias
- Producción siempre está estable.
- Dev actúa como staging de integración.
- Cada persona tiene autonomía total en su rama.

---

## ADR-007 — El fallback a SQLite queda restringido a desarrollo

- **Fecha**: 2026-08-12
- **Estado**: ✅ Aceptado
- **Autor(es)**: Agente IA
- **Rama**: `juan`
- **Refina**: ADR-001 (que sigue vigente para el entorno de desarrollo)

### Contexto
El ADR-001 estableció un fallback automático de PostgreSQL a SQLite para que el desarrollo
local no exigiera Docker. Al preparar el despliegue en un host real (Render, Fly.io) se
detectó que ese fallback es peligroso en producción: `data.db` vive en el disco efímero del
contenedor. Si `DATABASE_URL` tiene un typo, credenciales caducadas o falla la negociación
SSL —Neon y la mayoría de proveedores gestionados exigen `sslmode=require`—, la aplicación
arranca sin errores, acepta registros y los pierde en cada reinicio o redespliegue.

El propio ADR-001 anticipaba "bugs edge-case" por las diferencias entre motores, pero no
contemplaba este modo de fallo, que es silencioso y destruye datos. Se registró como BUG-001.

### Opciones consideradas
1. **Dejar el fallback como está y documentarlo** — el riesgo depende de que nadie se
   equivoque al configurar el host. Inaceptable para una herramienta de emergencia.
2. **Eliminar SQLite del proyecto** — resolvería el problema pero rompería el desarrollo
   local sin Docker, que es justamente lo que el ADR-001 quería proteger.
3. **Condicionar el fallback al entorno** — SQLite sigue disponible en desarrollo; en
   producción la ausencia de PostgreSQL es un error fatal de arranque.

### Decisión
Opción 3. `server/db.js` lee `NODE_ENV`: si vale `production` y no hay conexión a PostgreSQL
(por `DATABASE_URL` ausente o por fallo de conexión), `initDB()` lanza un error con el
diagnóstico concreto. `server/index.js` lo captura y termina con `process.exit(1)` para que
Docker, Render o Fly marquen el despliegue como fallido en vez de dejar un contenedor vivo
sin servidor escuchando.

### Consecuencias
- Un error de configuración de base de datos se manifiesta al desplegar, no días después
  al descubrir que los registros desaparecieron.
- Se protege el MUST-HAVE #2 del Project Brief: los listados deben ser públicos y compartidos.
  Un despliegue sobre SQLite efímero degradaría la plataforma a una libreta local.
- El desarrollo local mantiene exactamente la ergonomía del ADR-001: `npm start` sin Docker
  sigue funcionando contra SQLite.
- Contrapartida: `docker-compose.yml` define `NODE_ENV=production`, así que el stack local
  también exige PostgreSQL. Es coherente —ese stack existe para replicar producción— pero
  conviene saberlo antes de levantar el compose.

---

## ADR-008 — Las fotos se sirven en un endpoint aparte, no embebidas en el listado

- **Fecha**: 2026-08-12
- **Estado**: ✅ Aceptado
- **Autor(es)**: Agente IA
- **Rama**: `juan`
- **Complementa**: ADR-002 (que sigue vigente: define cómo se *procesan* y *almacenan* las
  imágenes; este ADR decide cómo se *entregan*)

### Contexto
El ADR-002 estableció guardar cada foto como data URI base64 en la columna
`foto.imagen_base64`. La entrega, en cambio, nunca se decidió explícitamente: el listado
`GET /api/viviendas` hacía `LEFT JOIN foto` y devolvía el data URI completo de cada
vivienda dentro del JSON.

Eso significa que la carga inicial de la pestaña "Dónde Alojarse" descarga todas las fotos
de golpe, sin caché y sin posibilidad de cancelarlas. Con las 30 viviendas que el
Project Brief fija como métrica de éxito a 72 horas, son varios MB en una sola petición
—medido con una vivienda real: 616 KB de JSON por registro con foto—. El mismo brief
describe a sus usuarios navegando "muchas veces con datos limitados" (MUST-HAVE #5) y pide
un "modo de solo lectura optimizado" entre los *nice-to-have*.

### Opciones consideradas
1. **Dejarlo como está** — cero trabajo, pero contradice frontalmente el MUST-HAVE #5 y
   encarece el ancho de banda del hosting gratuito.
2. **Paginar el listado** — reduce el problema pero no lo resuelve: cada página sigue
   arrastrando las fotos embebidas, y añade complejidad de estado en el cliente.
3. **Mover las imágenes a almacenamiento de objetos (S3, R2)** — lo correcto a gran escala,
   pero añade un proveedor externo, credenciales y coste, justo lo que el MVP evita.
4. **Endpoint dedicado por foto, sirviendo binario** — sin dependencias nuevas, sin cambiar
   el esquema y compatible con la caché del navegador.

### Decisión
Opción 4. `GET /api/viviendas` deja de incluir la imagen; el campo `foto_id`, que ya viajaba
en `v.*`, indica si hay foto que pedir. Se añade `GET /api/viviendas/:id/foto`, que decodifica
el data URI almacenado y responde **WebP binario** con `Content-Type: image/webp` y
`Cache-Control: public, max-age=31536000, immutable`. El cliente las solicita con
`loading="lazy"`, de modo que sólo se descargan las que entran en pantalla.

El almacenamiento no cambia: la columna sigue guardando base64, tal como fijó el ADR-002.
Sólo cambia la entrega.

### Consecuencias
- El JSON del listado pasa de ~616 KB por vivienda con foto a ~640 bytes.
- Transmitir bytes crudos elimina el ~25-33 % de sobrecarga que añade la codificación base64.
- Las fotos quedan cacheadas por el navegador de forma indefinida. Es seguro porque el
  Project Brief excluye explícitamente editar un registro una vez enviado: la imagen de un
  `id` dado nunca cambia.
- **Cambio incompatible en la API**: las respuestas de `GET /api/viviendas` ya no incluyen
  `imagen_base64`. Cualquier consumidor externo tendría que adaptarse. Hoy el único
  consumidor es `public/app.js`, ya actualizado.
- El endpoint aplica el mismo filtro `sospechoso = false` que el listado, para que la foto
  de un registro en cuarentena no siga siendo accesible por URL directa.
- Deuda pendiente: guardar base64 en la base de datos sigue costando ~33 % de espacio extra
  y obliga a decodificar en cada petición no cacheada. Migrar la columna a `BYTEA`/`BLOB`
  sería el siguiente paso natural, y requeriría su propio ADR y una migración de datos.

---

## ADR-009 — PostgreSQL como único motor: se retira el fallback a SQLite

- **Fecha**: 2026-08-12
- **Estado**: ✅ Aceptado
- **Autor(es)**: Emmanuel Peñuela Chica, Agente IA
- **Rama**: `dev`
- **Reemplaza a**: ADR-001 (que queda como registro histórico; el ADR-007 que lo refinaba
  pierde su objeto, porque ya no existe fallback que restringir)

### Contexto
El ADR-001 estableció PostgreSQL con fallback automático a SQLite para que el desarrollo
local no exigiera Docker. El ADR-007 ya restringió ese fallback a desarrollo, tras el
BUG-001 (en producción degradaba en silencio y perdía todos los registros).

Resuelto lo peligroso, quedaba el coste de mantener dos motores, que resultó ser mayor de
lo que parecía:

1. **Esquema duplicado a mano** en `createPostgresTables()` y `createSqliteTables()`. Cada
   columna nueva había que escribirla dos veces con el tipo equivalente
   (`UUID`↔`TEXT`, `BOOLEAN`↔`INTEGER`, `TIMESTAMP`↔`DATETIME`). El propio ADR-001 anotó
   esta deuda al aceptarse.
2. **Capa de traducción de placeholders**: el código escribía `?` (sintaxis SQLite) y
   `query()` los convertía a `$1, $2…` con `sql.replace(/\?/g, …)`. Ese replace era global
   e incondicional: habría roto cualquier consulta con un `?` dentro de un literal de texto.
   Ninguna lo tenía todavía, pero era una mina enterrada.
3. **Falta de paridad dev/producción**: toda la batería de pruebas del proyecto se había
   ejecutado contra SQLite, mientras que lo desplegado corre sobre PostgreSQL. Se verificó
   manualmente que la aplicación funcionaba en PostgreSQL, pero cada cambio futuro
   arrastraba el mismo riesgo y habría exigido repetir esa verificación.
4. **Peso muerto**: `sqlite3` es un módulo nativo que se compilaba en la imagen Docker sin
   usarse jamás en producción. Retirarlo eliminó 122 paquetes del árbol de dependencias.

### Opciones consideradas
1. **Mantener el fallback** — cero trabajo; el riesgo grave ya estaba corregido. Pero
   perpetúa el esquema duplicado, la traducción frágil y la falta de paridad.
2. **Mantener SQLite sólo para tests automatizados** — atractivo sobre el papel, pero el
   proyecto aún no tiene suite de tests, así que hoy no aporta nada.
3. **PostgreSQL como único motor** — una fuente de verdad para el esquema, placeholders
   nativos y las mismas garantías en desarrollo que en producción.

### Decisión
Opción 3. `server/db.js` exige `DATABASE_URL` siempre y falla al arrancar si falta o no
conecta, con un mensaje que indica las dos vías de desarrollo local. Se eliminan
`createSqliteTables()`, la rama SQLite de `query()` y la dependencia `sqlite3`.

Las 27 consultas de `server/index.js` se migraron de `?` a placeholders nativos `$1, $2…`,
de modo que `query()` queda como una envoltura fina sobre `pgPool.query()` sin ninguna
reescritura del SQL.

**El desarrollo local pasa a exigir PostgreSQL**, por una de estas dos vías:
- `docker compose up -d db` (requiere copiar `.env.example` a `.env`), o
- una rama de desarrollo de Neon, con `?sslmode=require`.

### Consecuencias
- Una sola definición del esquema. Añadir una columna se hace en un único sitio.
- Desaparece la traducción de placeholders y con ella su fragilidad.
- Lo que se prueba en local es exactamente lo que corre en producción.
- **Coste asumido**: se pierde el `npm run dev` sin dependencias externas que buscaba el
  ADR-001. Quien no tenga Docker ni una cadena de conexión no puede levantar el proyecto.
  El equipo lo aceptó explícitamente a cambio de la paridad.
- Sigue sin haber sistema de migraciones: las tablas se crean con `CREATE TABLE IF NOT
  EXISTS` al arrancar, así que **añadir una columna no la agrega a una base de datos que ya
  existe**; requiere un `ALTER TABLE` manual. Esta deuda es ahora más visible al haber un
  solo motor, y merecerá su propio ADR cuando el esquema empiece a evolucionar.
