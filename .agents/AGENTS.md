# 🤖 AGENTS.md — Instrucciones Maestras para Agentes IA
# Proyecto: Alojamiento por Terremoto en Colombia
# Última actualización: 2026-08-12

---

## ⚠️ REGLA NÚMERO UNO: LEER ANTES DE ACTUAR

**Antes de escribir una sola línea de código, el agente DEBE leer los documentos
correspondientes a su tarea. No hacerlo es motivo de rechazo del trabajo.**

---

## 📋 ÁRBOL DE DOCUMENTACIÓN OBLIGATORIA

```
docs/
├── CHANGELOG.md       ← Versiones, releases, qué cambió en cada una
├── COMMITS.md         ← Registro detallado de todos los commits por rama y autor
├── BUGS.md            ← Bugs activos, resueltos y en progreso
├── DECISIONS.md       ← Decisiones arquitectónicas (ADR) y por qué se tomaron
└── origen/            ← Documentos de origen del proyecto (solo lectura histórica)
    ├── PRD.md
    ├── Project-Brief.md
    ├── modelo-de-datos.md
    ├── historia-usuario-alojamiento.md
    ├── pie-de-pagina.md
    └── diseñoAplicacionWeb.html

.agents/
├── AGENTS.md          ← ESTE ARCHIVO (instrucciones para agentes)
└── workflows/
    └── qa-build-workflow.md  ← Workflow de QA secuencial de 6 fases

CHANGELOG.md           ← (raíz) Alias/espejo del changelog principal — no editar aquí
```

---

## 🗺️ TABLA DE DECISIÓN: ¿Qué documento leer según la tarea?

| Si el usuario pide...                              | Leer PRIMERO                         | Actualizar al terminar           |
|----------------------------------------------------|--------------------------------------|----------------------------------|
| Agregar o modificar una **feature**                | `docs/CHANGELOG.md`, `docs/DECISIONS.md` | `docs/CHANGELOG.md`, `docs/COMMITS.md` |
| Corregir un **bug o error**                        | `docs/BUGS.md`                       | `docs/BUGS.md`, `docs/COMMITS.md` |
| Hacer un **refactor o cambio arquitectónico**      | `docs/DECISIONS.md`, `docs/CHANGELOG.md` | `docs/DECISIONS.md`, `docs/COMMITS.md` |
| Crear o modificar **pruebas (tests)**              | `docs/BUGS.md`, `docs/CHANGELOG.md`  | `docs/COMMITS.md`                |
| Hacer un **release o merge** a `dev` o `main`     | `docs/CHANGELOG.md`, `docs/COMMITS.md` | `docs/CHANGELOG.md`, `docs/COMMITS.md` |
| Revisar **arquitectura o base de datos**           | `docs/DECISIONS.md`, `docs/origen/modelo-de-datos.md` | `docs/DECISIONS.md` |
| Ejecutar **QA o auditoría**                        | `.agents/workflows/qa-build-workflow.md`, `docs/BUGS.md` | `docs/BUGS.md`, `docs/COMMITS.md` |
| Cualquier **tarea no listada**                     | `docs/CHANGELOG.md` + `docs/BUGS.md` | `docs/COMMITS.md`                |

---

## 🌿 ESTRATEGIA DE RAMAS (OBLIGATORIO RESPETAR)

```
main        ← Producción. Solo recibe merges desde dev. NUNCA commit directo.
  └─ dev    ← Integración. Recibe merges desde ramas de feature/persona.
       ├─ juan       ← Rama de desarrollo personal de Juan Esteban
       ├─ emmanuel   ← Rama de desarrollo personal de Emmanuel
       └─ [nombre]   ← Nueva persona = nueva rama desde dev
```

**Regla de flujo**: `[rama-persona]` → `dev` → `main`
**Nunca** hacer commit directo a `main` ni a `dev`.

---

## ✍️ PROTOCOLO DE REGISTRO OBLIGATORIO DESPUÉS DE CADA CAMBIO

Al finalizar cualquier tarea, el agente DEBE actualizar los siguientes archivos:

### 1. `docs/COMMITS.md` — SIEMPRE
Agregar una entrada en la sección correspondiente a la rama activa.
Formato de entrada:
```markdown
| `abc1234` | YYYY-MM-DD | Nombre Autor | tipo(scope): descripción | [rama] |
```

### 2. `docs/BUGS.md` — Si se encontró o corrigió un bug
- Si se encontró: agregar a la sección **ACTIVOS** con estado `🔴 ABIERTO`.
- Si se corrigió: mover a **RESUELTOS** con estado `✅ RESUELTO` y el commit de fix.

### 3. `docs/CHANGELOG.md` — Si hay cambio que afecte a usuarios o API
Agregar bajo la versión `[Unreleased]` en la subsección correcta
(`Añadido`, `Cambiado`, `Corregido`, `Eliminado`, `Seguridad`).

### 4. `docs/DECISIONS.md` — Si se tomó una decisión arquitectónica
Agregar un nuevo ADR al final con número consecutivo.

---

## 📐 CONVENCIÓN DE COMMITS (Conventional Commits)

```
<tipo>(<scope>): <descripción corta en español>

Tipos permitidos:
  feat     → Nueva funcionalidad
  fix      → Corrección de bug
  docs     → Solo documentación
  refactor → Refactor sin cambio de comportamiento
  test     → Agregar o corregir tests
  chore    → Tareas de mantenimiento (build, deps, config)
  perf     → Mejora de rendimiento
  style    → Formato de código (no lógica)
  merge    → Merge entre ramas
  release  → Preparación de release

Scopes de este proyecto:
  vivienda, mascota, admin, db, auth, image, api, ui, docker, docs, tests
```

---

## ⛔ PROHIBICIONES ABSOLUTAS PARA AGENTES

1. **No modificar** `main` directamente sin pasar por `dev`.
2. **No hacer commit** sin actualizar `docs/COMMITS.md`.
3. **No corregir un bug** sin registrarlo primero en `docs/BUGS.md`.
4. **No tomar decisiones arquitectónicas** sin registrarlas en `docs/DECISIONS.md`.
5. **No ignorar** este archivo en ninguna circunstancia.
6. **No agregar librerías** no aprobadas en el stack técnico sin crear un ADR en `docs/DECISIONS.md`.

---

## 🔧 STACK TÉCNICO APROBADO (No negociable sin ADR)

- **Backend**: Node.js v20 LTS, Express.js v4, `pg.Pool` (PostgreSQL 16), Multer, Sharp
- **Frontend**: HTML5 Semántico, CSS3 Vanilla, JavaScript Vanilla ES6+
- **DB primaria**: PostgreSQL 16 Alpine | **Fallback**: SQLite
- **Contenerización**: Docker + Docker Compose
- **Testing**: Jest o Node Test Runner + Supertest

---

## 📞 EQUIPO

| Persona          | Rama Git   | Email                                     |
|------------------|------------|-------------------------------------------|
| Juan Esteban B.  | `juan`     | boterosanchezjuanesteban@gmail.com        |
| Emmanuel         | `emmanuel` | *(agregar email)*                         |
| Luis Felipe      | *(agregar)* | *(agregar email)*                        |
