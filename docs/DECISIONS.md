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
