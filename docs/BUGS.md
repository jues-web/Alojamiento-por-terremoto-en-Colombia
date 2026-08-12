# 🐛 BUGS.md — Registro de Bugs, Errores y Issues
# Proyecto: Alojamiento por Terremoto en Colombia

> **INSTRUCCIÓN PARA AGENTES**:
> - Antes de corregir cualquier bug: leer este archivo completo.
> - Al encontrar un bug: agregar en sección **ACTIVOS** con estado `🔴 ABIERTO`.
> - Al corregirlo: mover a **RESUELTOS** con el hash del commit de fix.
> - Al encontrar un bug conocido sin solución pronta: agregar en **CONOCIDOS**.

---

## 📌 FORMATO DE ENTRADA — BUG ACTIVO

```markdown
### BUG-XXX — Título breve del problema
- **Estado**: 🔴 ABIERTO | 🟡 EN PROGRESO | ✅ RESUELTO
- **Severidad**: 🔴 Crítica | 🟠 Alta | 🟡 Media | 🟢 Baja
- **Rama afectada**: `juan` / `dev` / `main`
- **Reportado por**: Nombre — YYYY-MM-DD
- **Asignado a**: Nombre o *sin asignar*
- **Descripción**: Qué pasa exactamente.
- **Pasos para reproducir**:
  1. Paso 1
  2. Paso 2
- **Resultado esperado**: Qué debería pasar.
- **Resultado actual**: Qué pasa en realidad.
- **Commit de fix**: `hash` (dejar vacío si no hay fix aún)
- **Notas**: Observaciones adicionales.
```

---

## 🔴 BUGS ACTIVOS

> *No hay bugs activos registrados a la fecha.*

---

## 🟡 BUGS EN PROGRESO (Alguien está trabajando en ellos)

> *No hay bugs en progreso.*

---

## ✅ BUGS RESUELTOS

### BUG-001 — Fallback silencioso a SQLite provoca pérdida total de datos en producción
- **Estado**: ✅ RESUELTO
- **Severidad**: 🔴 Crítica
- **Rama afectada**: `juan`
- **Reportado por**: Agente IA — 2026-08-12
- **Asignado a**: Agente IA
- **Descripción**: `server/db.js` capturaba cualquier fallo de conexión a PostgreSQL,
  emitía un `console.warn` y continuaba con SQLite sobre `data.db`. En un host como Render
  o Fly.io ese archivo vive en disco efímero: la aplicación arrancaba aparentemente sana,
  aceptaba registros y los perdía en cada reinicio o redespliegue, sin ningún error visible.
  Un simple typo en `DATABASE_URL` o un fallo de negociación SSL (Neon exige `sslmode=require`)
  bastaba para dispararlo.
- **Pasos para reproducir**:
  1. Desplegar con `NODE_ENV=production` y un `DATABASE_URL` inválido.
  2. Registrar una vivienda desde la web — responde 201 correctamente.
  3. Reiniciar el contenedor.
  4. Consultar `GET /api/viviendas` — la lista vuelve vacía.
- **Resultado esperado**: El arranque falla con un error explícito y el despliegue se marca
  como fallido.
- **Resultado actual (antes del fix)**: Arranque exitoso, datos perdidos en silencio.
- **Impacto**: Rompía el MUST-HAVE #2 del Project Brief (listados públicos y compartidos).
  Con este bug la plataforma degradaba a "una libreta personal por contenedor".
- **Commit de fix**: `df81a17`
- **Notas**: El fallback a SQLite sigue activo en desarrollo, tal como define el ADR-001.
  La restricción aplica solo con `NODE_ENV=production` (ver ADR-007). Además,
  `server/index.js` ahora termina con `process.exit(1)` para que Docker/Render/Fly detecten
  el fallo; antes solo registraba el error y el contenedor quedaba vivo sin servidor escuchando.

### BUG-002 — `ADMIN_PASSWORD` con valor por defecto `admin123` en tres archivos
- **Estado**: ✅ RESUELTO
- **Severidad**: 🔴 Crítica
- **Rama afectada**: `juan`
- **Reportado por**: Agente IA — 2026-08-12
- **Asignado a**: Agente IA
- **Descripción**: La clave maestra del panel admin tenía `admin123` como valor por defecto
  en `server/index.js`, `entrypoint.sh` y `docker-compose.yml`. Publicar la plataforma sin
  sobrescribir la variable dejaba abierto a cualquiera el panel que **elimina cualquier registro**.
- **Pasos para reproducir**:
  1. Desplegar sin definir `ADMIN_PASSWORD`.
  2. `POST /api/admin/login` con `{"password":"admin123"}` → 200 con la clave.
  3. `DELETE /api/admin/eliminar/vivienda/:id` sobre cualquier registro → éxito.
- **Resultado esperado**: La aplicación se niega a arrancar en producción sin una clave fuerte.
- **Resultado actual (antes del fix)**: Arrancaba con la clave conocida.
- **Commit de fix**: `df81a17`
- **Notas**: En producción se exige ahora que `ADMIN_PASSWORD` exista, tenga 12+ caracteres
  y no figure en la lista de claves débiles conocidas. En desarrollo se mantiene el default
  con una advertencia en consola. `docker-compose.yml` la toma de `.env` con `${ADMIN_PASSWORD:?…}`.
  Contradice parcialmente el ADR-004, que ya exigía que la clave nunca estuviera en el código.

### BUG-003 — Cualquiera podía cambiar el estado de cualquier registro
- **Estado**: ✅ RESUELTO
- **Severidad**: 🔴 Crítica
- **Rama afectada**: `juan`
- **Reportado por**: Agente IA — 2026-08-12
- **Asignado a**: Agente IA
- **Descripción**: `PATCH /api/viviendas/:id/estado` consultaba el `owner_token` del registro
  y **descartaba el resultado**, actualizando el estado de todos modos.
  `PATCH /api/necesidades-vivienda/:id/estado` ni siquiera lo leía. Agravante: los listados
  públicos usaban `SELECT v.*` / `SELECT *`, por lo que **devolvían el `owner_token` de todos
  los registros** al cliente; incluso con la validación puesta, cualquiera podía copiarlo del
  JSON público y suplantar al autor.
- **Pasos para reproducir**:
  1. `GET /api/viviendas` y copiar el `id` de cualquier registro ajeno.
  2. `PATCH /api/viviendas/:id/estado` con `{"estado":"Ya fue ocupada"}` sin token → 200 OK.
- **Resultado esperado**: 403 salvo que el `owner_token` coincida o se envíe la clave admin.
- **Resultado actual (antes del fix)**: 200 OK para cualquiera. Un atacante podía marcar todas
  las viviendas como "Ya fue ocupada" y vaciar el listado en segundos.
- **Impacto**: Violaba el ADR-003 y el alcance explícito del Project Brief
  (*"evita que alguien borre o falsifique la oferta de otra persona"*), además de poner en
  riesgo el MUST-HAVE #4.
- **Commit de fix**: `df81a17`
- **Notas**: Tres cambios: (1) validación de `owner_token` con excepción para admin vía
  `x-admin-key`; (2) helper `sinDatosPrivados()` que elimina `owner_token` de los cinco GET
  públicos; (3) lista blanca de estados válidos por entidad, para que no se pueda escribir
  texto arbitrario en la columna `estado`.

### BUG-004 — El cambio de estado fallido no daba ninguna señal al usuario
- **Estado**: ✅ RESUELTO
- **Severidad**: 🟡 Media
- **Rama afectada**: `juan`
- **Reportado por**: Agente IA — 2026-08-12
- **Asignado a**: Agente IA
- **Descripción**: En `public/app.js`, `toggleEstadoVivienda()` y `toggleEstadoNecesidad()`
  solo actuaban dentro de `if (res.ok)` y tenían un `catch (e) {}` vacío. Al introducir el 403
  del BUG-003, el botón "Cambiar Estado" habría quedado aparentemente roto: clic sin respuesta.
- **Resultado esperado**: Mensaje claro de por qué no se pudo cambiar el estado.
- **Resultado actual (antes del fix)**: Silencio absoluto.
- **Commit de fix**: `df81a17`
- **Notas**: Detectado al implementar el fix de BUG-003. Ambas funciones muestran ahora el
  mensaje de error del servidor vía `showToast`, y el `catch` informa de la caída de red.
  Esto cubre parcialmente **BUG-K001** para este flujo concreto; los formularios de registro
  siguen pendientes.

### BUG-005 — Typo en `/api/stats` crea una variable global implícita
- **Estado**: ✅ RESUELTO
- **Severidad**: 🟢 Baja
- **Rama afectada**: `juan`
- **Reportado por**: Agente IA — 2026-08-12
- **Asignado a**: Agente IA
- **Descripción**: En `server/index.js`, dentro de `GET /api/stats`, la línea
  `const countN = parseIntnecesidades = parseInt(necesidades[0]?.count || 0, 10);`
  contenía un typo. Asignaba a `parseIntnecesidades`, un identificador no declarado,
  creando una variable global implícita.
- **Pasos para reproducir**:
  1. Leer `server/index.js`, endpoint `GET /api/stats`.
- **Resultado esperado**: `const countN = parseInt(necesidades[0]?.count || 0, 10);`
- **Resultado actual (antes del fix)**: Funcionaba por accidente. `countN` recibía el valor
  correcto y el endpoint respondía bien, porque CommonJS se ejecuta en modo *sloppy*. En modo
  estricto (o al migrar a ESM) habría lanzado `ReferenceError` tumbando el endpoint, y con él
  el contador del banner principal.
- **Commit de fix**: `7d1efdc`
- **Notas**: Verificado ejecutando una copia del servidor con `'use strict'` antepuesto:
  `/api/stats` devuelve los conteos correctos y no se registra ningún `ReferenceError`.
  Se revisó además el resto de `server/index.js`, `server/db.js` y `public/app.js` en busca
  de otras asignaciones dobles del mismo tipo: no hay ninguna.

---

## 📌 BUGS CONOCIDOS (Sin prioridad de fix inmediato)

> Estos son comportamientos conocidos que no bloquean el MVP pero deben atenderse.

### BUG-K001 — Desconexión de red durante envío de formulario no tiene feedback visual
- **Estado**: 📌 CONOCIDO
- **Severidad**: 🟡 Media
- **Rama afectada**: Todas
- **Reportado por**: Juan Esteban B. — 2026-08-12
- **Descripción**: Si la red cae mientras se envía el formulario, el usuario no ve ningún
  mensaje de error claro. El formulario simplemente no responde.
- **Resultado esperado**: Mensaje de error amigable "Sin conexión. Verifica tu internet."
- **Commit de fix**: *(pendiente)*
- **Notas**: Identificado en el workflow de QA (Fase 1, sección 1.3).

### BUG-K002 — Reinicio inesperado de contenedor PostgreSQL pierde conexiones activas
- **Estado**: 📌 CONOCIDO
- **Severidad**: 🟠 Alta
- **Rama afectada**: `juan`, `dev`
- **Reportado por**: Juan Esteban B. — 2026-08-12
- **Descripción**: Si el contenedor de PostgreSQL se reinicia, el pool `pg.Pool` no
  reconecta automáticamente y hay que reiniciar el contenedor `app`.
- **Resultado esperado**: Reconexión automática con backoff exponencial.
- **Commit de fix**: *(pendiente)*
- **Notas**: El fallback a SQLite mitiga parcialmente esto en entorno local.

---

## 📊 Resumen

| Categoría | Cantidad |
|-----------|----------|
| 🔴 Activos | 0 |
| 🟡 En Progreso | 0 |
| ✅ Resueltos | 5 |
| 📌 Conocidos | 2 |
| **Total** | **7** |

> Actualizar esta tabla cada vez que cambie el estado de un bug.
