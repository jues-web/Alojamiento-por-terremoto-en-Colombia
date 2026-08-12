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

> *No hay bugs resueltos aún (el proyecto acaba de iniciar).*

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
| ✅ Resueltos | 0 |
| 📌 Conocidos | 2 |
| **Total** | **2** |

> Actualizar esta tabla cada vez que cambie el estado de un bug.
