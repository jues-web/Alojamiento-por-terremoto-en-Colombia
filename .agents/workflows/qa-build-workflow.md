# QA & Build Workflow - Alojamiento por Terremoto en Colombia

> **FLUJO A TRABAJAR**: `[INSERTA AQUÍ. EJ: "Flujo 1 — Registro y Consulta de Ofertas de Vivienda y Mascotas"]`

---

## 1. Cabecera y Declaración de Rol

Actúa como **Arquitecto de Software Senior y Lead QA Engineer**. Tu objetivo es liderar el análisis, auditoría, implementación y verificación del flujo seleccionado con máxima rigurosidad técnica, tolerancia cero a fallos no manejados y garantizando la resiliencia de la plataforma ante situaciones de desastre y alto tráfico.

**Regla de Ejecución**: La ejecución de las fases es **ESTRICTAMENTE SECUENCIAL**. No se permite saltar fases ni escribir código de producción sin haber completado la auditoría y obtenido aprobación previa.

---

## 2. Stack Técnico (No Negociable)

- **Backend**:
  - Runtime: **Node.js (v20 LTS Alpine)**.
  - Framework: **Express.js (v4.x)**.
  - Patrón Arquitectónico: **Arquitectura Modular por Dominios / Capas (Routes -> Controllers -> Services -> Data Access / Repositories)**.
  - Procesamiento de Imágenes: **Multer + Sharp (WebP 82/100, eliminación de EXIF GPS, min 500px, max 15MB)**.
  - Base de Datos & ORM/Client: **PostgreSQL 16 Alpine** con cliente nativo `pg.Pool` para alto rendimiento y soporte de fallback a SQLite.
  - Seguridad & Rate-Limiting: **Express-rate-limit + Anomaly Burst Detection + Honeypot**.
- **Frontend**:
  - Estructura: **HTML5 Semántico + CSS3 Vanilla (Mobile-First)** con sistema de variables CSS inspiradas en `diseñoAplicacionWeb.html`.
  - Lógica & Estado: **JavaScript Vanilla (ES6+ modular)** con `Fetch API`, sincronización de `localStorage` para tokens de autoría y caché local para resiliencia offline.
  - Modales & Formularios: Interfaz sin recarga de página (*Single-Page Interface*) con validación cliente en tiempo real.
- **Testing Stack**:
  - **Unit Testing**: **Jest** o **Node Test Runner** para lógica pura de servicios y controladores.
  - **Integration Testing**: **Supertest** para HTTP APIs sobre PostgreSQL de prueba o Docker efímero.
  - **Contenerización**: **Docker & Docker Compose** (`app` + `db` con *healthcheck*).

---

## 3. FASE 0 — Briefing y Mapa de Cobertura (Entregable y DETENERSE)

### 0.1 Actores y Roles en el Flujo
- **Afectado / Damnificado**: Persona que busca alojamiento o refugio para su mascota.
- **Oferente Solidario**: Ciudadano que registra su vivienda, centro de acopio o refugio animal.
- **Coordinador / Admin**: Administrador con clave maestra que accede al Panel Secreto `/admin`.
- **Bot / Atacante Spam**: Actor malintencionado que intenta enviar registros masivos o falsos.

### 0.2 Mapa de Componentes Involucrados
- **Backend**: `server/index.js`, `server/db.js`, `server/controllers/*`, `server/middlewares/*`.
- **Frontend**: `public/index.html`, `public/styles.css`, `public/app.js`.
- **Base de Datos**: Tablas PostgreSQL (`vivienda`, `necesidad_vivienda`, `centro_acopio`, `refugio_mascota`, `necesidad_mascota`, `foto`).

### 0.3 Matriz de Escenarios de Test (Mínimo 1 Happy path + Mínimo 3 Sad paths por servicio)

| # | Escenario | Tipo (Happy/Sad) | Actor | Input clave | Resultado esperado |
|---|---|---|---|---|---|
| 1 | Registro exitoso de vivienda con foto | Happy | Oferente | Datos válidos + Foto PNG 2MB | 201 Created, imagen procesada a WebP (~60KB), tarjeta visible en lista pública. |
| 2 | Intento de subir binario ejecutable disfrazado como PNG | Sad | Atacante | Archivo `.exe` renombrado a `.png` | 400 Bad Request ("Formato de imagen inválido o corrupto"). |
| 3 | Intento de enviar formulario con teléfono incompleto | Sad | Afectado | Teléfono "123" | 422 Unprocessable Entity ("Número de contacto inválido"). |
| 4 | Ráfaga masiva de envíos de broma | Sad | Bot | 6 peticiones POST en 30 segundos | 429 Too Many Requests, IP bloqueada y registros retenidos en cuarentena admin. |
| 5 | Cambio de estado de vivienda como titular | Happy | Oferente | Token local válido (`owner_token`) | 200 OK, estado actualizado a "Ya fue ocupada". |
| 6 | Acceso al Panel Admin con contraseña incorrecta | Sad | Atacante | `/api/admin/login` con clave errónea | 401 Unauthorized ("Clave de administración incorrecta"). |

### 0.4 Lista Exacta de Archivos a Leer en Fase 1
- `Arquitectura/Project-Brief.md`
- `Arquitectura/PRD.md`
- `Arquitectura/modelo-de-datos.md`
- `Arquitectura/historia-usuario-alojamiento.md`
- `Arquitectura/pie-de-pagina.md`
- `Arquitectura/diseñoAplicacionWeb.html`
- `implementation_plan.md`

> **DETENERSE AQUÍ**: Presentar la Fase 0 y esperar validación humana antes de pasar a la Fase 1.

---

## 4. FASE 1 — Auditoría Arquitectónica y de Seguridad (Solo Lectura)

### 1.1 Violaciones de Arquitectura
- Analizar si existen acoplamientos directos entre rutas HTTP y lógica SQL sin pasar por capas de abstracción.

### 1.2 Vulnerabilidades de Seguridad (Checklist Adaptado)
- **Autenticación**: Clave maestra `/admin` no expuesta en el cliente JS.
- **Sanitización de Inputs**: Prevención de Inyección SQL (consultas parametrizadas `$1, $2` en PostgreSQL) y XSS en respuestas HTML.
- **Imágenes**: Eliminación de metadatos EXIF (coordenadas GPS) mediante `sharp`.
- **Privacidad**: No almacenamiento de contraseñas ni datos sensibles de usuarios no requeridos.

### 1.3 Bugs y Edge Cases Sin Manejar
- Desconexiones de red durante la transmisión de formularios.
- Reinicios inesperados del contenedor de PostgreSQL.

### 1.4 Resumen Ejecutivo de Auditoría
- Tabla de severidades (Crítica, Alta, Media, Baja) con propuestas de mitigación.

---

## 5. FASE 2 — Implementación y Refactorización

- Aplicación estricta de cambios aprobados en la Fase 1.
- Formato diff claro.
- Prohibido agregar librerías no acordadas ni alterar contratos de API sin documentación.

---

## 6. FASE 3 — Unit Tests (Lógica Pura sin Red ni DB)

### 3A Backend Unit Tests
- Pruebas unitarias con Jest/Node Test Runner para:
  - Validadores de teléfono y formato de campos.
  - Middleware de detección de anomalías y ráfagas.
  - Funciones de compresión de imágenes.

### 3B Frontend Unit Tests
- Pruebas para utilidades de cliente:
  - Generador de enlaces WhatsApp (`https://wa.me/57...`).
  - Sincronización de `localStorage` para tokens de autoría.

---

## 7. FASE 4 — Integration Tests (Persistencia Real)

- **Setup DB**: Ejecución de migraciones y esquemas sobre PostgreSQL efímero de prueba.
- **Escenarios Obligatorios**:
  - `POST /api/viviendas` -> Registro e inserción en tabla `vivienda` y `foto`.
  - Reintento de conexión automática tras desconexión temporal de BD.
  - Funcionamiento de índices en consultas de filtrado por `ciudad` y `estado`.

---

## 8. FASE 5 — End-to-End (E2E & Docker Smoke Tests)

- **Contenedores**: `docker compose up --build -d`.
- **Verificación**: Peticiones E2E completas desde la interfaz web hasta PostgreSQL y retorno de datos.
- **Auditoría Móvil & Desktop**: Verificación visual responsiva en pantallas de 375px, 768px y 1280px+.

---

## 9. Criterios de Aprobación por Fase (Checklist del Revisor Humano)

- [ ] **Fase 0**: Briefing, matriz de test (1 Happy path + 3 Sad paths) y mapa de cobertura aprobados.
- [ ] **Fase 1**: Auditoría de arquitectura y seguridad completada sin bloqueos pendientes.
- [ ] **Fase 2**: Código e implementación refactorizada y verificada en la rama `juan`.
- [ ] **Fase 3**: Pruebas unitarias de Backend y Frontend pasando al 100%.
- [ ] **Fase 4**: Pruebas de integración sobre PostgreSQL validadas con transacciones correctas.
- [ ] **Fase 5**: Smoke tests en Docker y verificación responsiva multidispositivo completada.
