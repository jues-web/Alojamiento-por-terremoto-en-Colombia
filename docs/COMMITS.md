# 📋 COMMITS.md — Registro de Commits por Rama y Autor
# Proyecto: Alojamiento por Terremoto en Colombia

> **INSTRUCCIÓN PARA AGENTES**: Después de cada commit, agregar una fila a la tabla
> de la rama correspondiente. Usar el formato exacto indicado.
> Si no hay tabla para esa rama, crear una nueva sección siguiendo el patrón.

---

## 📌 FORMATO DE ENTRADA

```
| `hash_corto` | YYYY-MM-DD | Nombre Autor | tipo(scope): descripción breve | estado |
```

**Estado posibles**: `✅ ok` | `⚠️ revisión` | `🔴 reverted`

---

## 🌿 RAMA: `main` (Producción — solo merges desde dev)

| *(pendiente)* | 2026-08-12 | Agente IA | `merge(main): integrar desde dev el fix BUG-007` | ✅ ok |
| Hash | Fecha | Autor | Mensaje | Estado |
|------|-------|-------|---------|--------|
| `48df43f` | 2026-08-12 | Agente IA | `merge(main): integrar desde dev el MVP v1.0.0 completo preparado para despliegue` | ✅ ok |
| `2239fd8` | 2026-08-11 | Juan Esteban B. | `docs: create architecture documentation including PRD, project brief, data model, and footer information` | ✅ ok |


---

## 🌿 RAMA: `dev` (Integración — solo merges desde ramas personales)

| *(pendiente)* | 2026-08-12 | Agente IA | `merge(dev): integrar desde juan el fix BUG-007 y docs` | ✅ ok |
| Hash | Fecha | Autor | Mensaje | Estado |
| `a9a60e6` | 2026-08-12 | Agente IA | `fix(ui,db): vincular e ilustrar correctamente imagenes de viviendas y habitaciones (BUG-006)` | ✅ ok |
| `7cc4a16` | 2026-08-12 | Agente IA | `docs: registrar ADR-009 sobre PostgreSQL como unico motor` | ✅ ok |
| `e9090bd` | 2026-08-12 | Emmanuel P. / Agente IA | `refactor(db): PostgreSQL como unico motor, se retira SQLite (ADR-009)` | ✅ ok |
| `1ebd65b` | 2026-08-12 | Agente IA | `merge(dev): integrar desde juan el fix BUG-K001 y la entrega de fotos (ADR-008)` | ✅ ok |
| `93aa4fd` | 2026-08-12 | Agente IA | `merge(dev): integrar desde juan el MVP completo y los fixes de seguridad BUG-001 a BUG-005` | ✅ ok |
| `db2c582` | 2026-08-11 | Juan Esteban B. | `docs: add user stories and architecture requirements for the emergency housing platform` | ✅ ok |

> ⚠️ Igual que en `main`, se retira la entrada `21078ed`
> (`merge(dev): integrar MVP completo desde rama juan…`) y la fila `*(merge)*` del fix
> de credenciales: esos commits no existen en el repositorio y `origin/dev` seguía en
> `db2c582` (solo documentación). El merge real de `juan` → `dev` es el que encabeza
> esta tabla.

---

## 🌿 RAMA: `juan` (Desarrollo — Juan Esteban Botero Sánchez)

| Hash | Fecha | Autor | Mensaje | Estado |
|------|-------|-------|---------|--------|
| `b9b6d28` | 2026-08-12 | Agente IA | `docs: cerrar BUG-007 en BUGS.md, CHANGELOG y actualizar COMMITS.md` | ✅ ok |
| `264ed79` | 2026-08-12 | Agente IA | `fix(api,ui): limitar números de teléfono a máximo 10 dígitos (BUG-007)` | ✅ ok |
| `9c38784` | 2026-08-12 | Agente IA | `docs: cerrar BUG-006 en BUGS.md, CHANGELOG y COMMITS.md` | ✅ ok |
| `5e7e6da` | 2026-08-12 | Agente IA | `fix(api,ui): corregir 429 por rate limit y panel admin en blanco (BUG-006)` | ✅ ok |
| `b9b6d28` | 2026-08-12 | Agente IA | `docs: registrar ADR-008 sobre la entrega de fotos y el cambio de API` | ✅ ok |
| `f689467` | 2026-08-12 | Agente IA | `perf(api): servir las fotos aparte en vez de embeberlas en el listado` | ✅ ok |
| `ef918fb` | 2026-08-12 | Agente IA | `docs: cerrar BUG-K001 en BUGS.md y CHANGELOG` | ✅ ok |
| `397d698` | 2026-08-12 | Agente IA | `fix(ui): dar feedback de red y de validacion en los formularios (BUG-K001)` | ✅ ok |
| `e446b6e` | 2026-08-12 | Agente IA | `docs(commits): corregir registro de merges a dev y main que nunca ocurrieron` | ✅ ok |
| *(merge)* | 2026-08-12 | Agente IA | `merge(juan): integrar fix de credenciales docker (78438f5) con los fixes de seguridad locales` | ✅ ok |
| `b9b6d28` | 2026-08-12 | Agente IA | `docs: cerrar BUG-005 en BUGS.md, CHANGELOG y CLAUDE.md` | ✅ ok |
| `7d1efdc` | 2026-08-12 | Agente IA | `fix(api): corregir typo en /api/stats que creaba una global implicita (BUG-005)` | ✅ ok |
| `f43a457` | 2026-08-12 | Agente IA | `docs: registrar BUG-001 a BUG-005, ADR-007 y agregar CLAUDE.md` | ✅ ok |
| `df81a17` | 2026-08-12 | Agente IA | `fix(api): corregir bloqueadores de seguridad previos al despliegue` | ✅ ok |
| `119fe3d` | 2026-08-12 | Agente IA | `chore: forzar LF en el repositorio con .gitattributes` | ✅ ok |
| `78438f5` | 2026-08-12 | Agente IA | `fix(docker): eliminar credenciales hardcodeadas — variables de entorno para produccion segura` | ✅ ok |
| `0ffcc07` | 2026-08-12 | Juan Esteban B. | `refactor: mover Arquitectura a docs/origen como documentacion historica de inicio del proyecto` | ✅ ok |
| `b9b6d28` | 2026-08-12 | Agente IA | `docs: crear sistema de control de cambios — AGENTS.md, COMMITS.md, BUGS.md, DECISIONS.md, CHANGELOG.md` | ✅ ok |
| `0fc18ab` | 2026-08-11 | Juan Esteban B. | `chore: agregar entrypoint.sh seeder, fix docker-compose version obsoleto y restart=always garantizado` | ✅ ok |
| `a4a8eaa` | 2026-08-11 | Juan Esteban B. | `feat: MVP Alojamiento por terremoto en Colombia listo en rama juan con Docker, Postgres, Sharp y Admin Panel` | ✅ ok |
| `2239fd8` | 2026-08-11 | Juan Esteban B. | `docs: create architecture documentation including PRD, project brief, data model, and footer information` | ✅ ok |

---

## 🌿 RAMA: `emmanuel` (Desarrollo — Emmanuel)

| Hash | Fecha | Autor | Mensaje | Estado |
|------|-------|-------|---------|--------|
| `db2c582` | 2026-08-11 | Juan Esteban B. | `docs: add user stories and architecture requirements for the emergency housing platform` | ✅ ok |

> ℹ️ *Pendiente: Emmanuel debe hacer su primer commit independiente en esta rama.*

---

## 🌿 RAMA: `[nueva-rama]` — Plantilla para nuevas personas

> Copiar esta sección y reemplazar `[nombre]` y `[email]`.

```markdown
## 🌿 RAMA: `[nombre]` (Desarrollo — [Nombre Completo])

| Hash | Fecha | Autor | Mensaje | Estado |
|------|-------|-------|---------|--------|
| *(primer commit aquí)* | YYYY-MM-DD | [Nombre] | `tipo(scope): descripción` | ✅ ok |
```

---

## 📊 Resumen Global de Commits

| Rama | Total Commits | Último Commit | Autor Principal |
|------|--------------|---------------|-----------------|
| `main` | 1 | 2026-08-11 | Juan Esteban B. |
| `dev` | 5 | 2026-08-12 | Emmanuel P. / Agente IA |
| `juan` | 18 | 2026-08-12 | Juan Esteban B. / Agente IA |
| `emmanuel` | 1 | 2026-08-11 | Juan Esteban B. |

> Actualizar esta tabla cada vez que se agreguen commits.
