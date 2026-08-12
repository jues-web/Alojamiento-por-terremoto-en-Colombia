# Historia de Usuario — Plataforma "Alojamiento para personas y mascotas"

**Contexto:** Terremoto de magnitud 7.4 ocurrido el 10 de agosto de 2026 en Colombia (epicentro San José del Palmar, Chocó), con afectaciones graves en Manizales, Pereira, Cali y Quibdó. Se requiere una herramienta web urgente para conectar a personas que ofrecen alojamiento con familias damnificadas, y a quienes ofrecen/necesitan refugio para mascotas.

---

## Historia de usuario principal

> **Como** ciudadano afectado por el terremoto o como persona solidaria que quiere ayudar,
> **quiero** una página web sencilla donde pueda registrar o consultar ofertas y necesidades de alojamiento, centros de acopio y refugio para mascotas,
> **para que** la ayuda llegue rápido a quienes la necesitan, sin barreras técnicas y desde cualquier dispositivo (celular o computador).

### Criterios de aceptación generales
- El enlace debe funcionar para **cualquier persona**, sin necesidad de crear cuenta ni iniciar sesión.
- Todo lo que una persona registre debe quedar **visible para todos los demás usuarios** del enlace (datos compartidos, no locales a cada dispositivo).
- La página debe ser **responsive** (se ve y se usa bien en celular, que es como la mayoría accederá).
- Debe cargar rápido y funcionar con conexión a internet limitada (zona de emergencia).
- Debe incluir un aviso visible de que es una iniciativa ciudadana y no reemplaza la Línea 123 / UNGRD / Cruz Roja.

---

## Estructura de navegación

4 pestañas fijas en la parte superior:

1. **Inicio**
2. **Listado de lugares donde alojarse**
3. **Personas que necesitan vivienda**
4. **Refugio para mascotas**

---

## Épica 1 — Pestaña "Inicio"

**Como** usuario que entra por primera vez,
**quiero** entender de qué se trata la página y encontrar rápido el formulario que necesito,
**para** no perder tiempo en un momento de emergencia.

### Contenido
- Título: **"Alojamiento para personas y mascotas"**.
- Descripción breve de 2-3 líneas explicando el propósito.
- Aviso de que es una iniciativa comunitaria (no oficial).
- **5 cuadros/tarjetas grandes, fáciles de tocar en celular**, cada uno abre su formulario correspondiente:

| # | Tarjeta | Abre formulario |
|---|---------|------------------|
| 1 | Registrar una vivienda | Formulario 1 |
| 2 | Necesito vivienda | Formulario 2 |
| 3 | Registrar centro de acopio | Formulario 3 |
| 4 | Registrar refugio para animales | Formulario 4 |
| 5 | Necesito refugio para mi mascota | Formulario 5 |

**Sugerencia de mejora incluida:** un contador en vivo (ej. "23 viviendas ofrecidas · 15 familias buscando") para dar sensación de comunidad activa y confianza en que la herramienta funciona.

---

## Épica 2 — Formularios de registro

**Como** usuario que quiere ofrecer o solicitar ayuda,
**quiero** llenar un formulario corto y claro,
**para** registrar mi información sin fricción.

### Formulario 1 — Registrar una vivienda para alojar damnificados

| Campo | Tipo | Opciones | Obligatorio |
|---|---|---|---|
| Tipo | Selección | Casa, Bodega, Apartamento, Habitación | Sí |
| Ciudad | Selección | Manizales, Pereira, Cali, Quibdó, Armenia | Sí |
| Barrio o localidad | Texto corto | — | Sí |
| ¿Cuántas personas puede albergar? | Selección | Una, Dos, Tres, Cuatro, Más de cuatro | Sí |
| Detalles | Texto largo | — | No |
| Nombre del encargado | Texto corto | — | Sí |
| Contacto | Texto corto | — | **Sí (obligatorio)** |
| Foto | Imagen | — | No (opcional) |
| Estado | Selección | Busca ocupante, Ya fue ocupada | Sí (por defecto: Busca ocupante) |

### Formulario 2 — Necesito vivienda

| Campo | Tipo | Opciones | Obligatorio |
|---|---|---|---|
| Nombre de la familia o encargado | Texto corto | — | Sí |
| Contacto | Texto corto | — | **Sí (obligatorio)** |
| Ciudad | Selección | Manizales, Pereira, Cali, Quibdó, Armenia, Otra | Sí |
| ¿Cuántas personas son? | Selección | Una, Dos, Tres, Cuatro, Más de cuatro | Sí |
| ¿Requiere condición especial? | Selección | Sí / No | Sí |
| → Si "Sí": Descripción de la condición especial | Texto largo (campo condicional) | — | Sí si aplica |
| Descripción de la vivienda que necesitan | Texto largo | Sector preferido, tipo, N.º de habitaciones | Sí |
| Estado | Selección | Buscando alojamiento, Ya encontró alojamiento | Sí (por defecto: Buscando alojamiento) |

### Formulario 3 — Registrar Centro de Acopio

| Campo | Tipo | Obligatorio |
|---|---|---|
| Ciudad | Texto/Selección | Sí |
| Sector | Texto corto | Sí |
| Dirección | Texto corto | Sí |
| Contacto | Texto corto | Sí |

### Formulario 4 — Registrar Refugio para animales

| Campo | Tipo | Opciones | Obligatorio |
|---|---|---|---|
| Tipo de mascota | Selección | Perros, Gatos, Perros y gatos, Otros | Sí |
| Ciudad | Texto/Selección | — | Sí |
| Sector | Texto corto | — | Sí |
| Dirección | Texto corto | — | Sí |
| Contacto | Texto corto | — | Sí |

### Formulario 5 — Necesito refugio para mi mascota

| Campo | Tipo | Opciones | Obligatorio |
|---|---|---|---|
| Nombre de la persona encargada | Texto corto | — | Sí |
| Contacto | Texto corto | — | Sí |
| Tipo de mascota | Selección | Perro, Gato, Perros y gatos, Otros | Sí |
| ¿Cuántas mascotas son? | Selección | Una, Dos, Tres o más | Sí |

### Criterios de aceptación (todos los formularios)
- Validación de campos obligatorios antes de enviar.
- Mensaje de confirmación visible al guardar exitosamente ("toast" o similar).
- El formulario se limpia y se cierra tras un envío exitoso.
- Si falla el guardado (ej. sin internet), mostrar mensaje de error y permitir reintentar sin perder lo escrito.
- Los nuevos registros deben aparecer inmediatamente en la pestaña de listado correspondiente.

---

## Épica 3 — Pestaña "Listado de lugares donde alojarse"

**Como** persona que ofrece ayuda o autoridad coordinando la respuesta,
**quiero** ver todos los centros de acopio y viviendas disponibles,
**para** identificar rápido dónde hay recursos.

### Contenido (en este orden)
1. Título **"Centros de Acopio"** + lista de todos los registros del Formulario 3.
2. Título **"Lista de vivienda y habitaciones"** + lista de todos los registros del Formulario 1.

### Comportamiento
- Cada elemento de la lista es **clicable pero no editable**: al presionarlo se abre una vista de detalle con toda la información del formulario.
- Mostrar un indicador visual de estado (ej. etiqueta de color) para "Busca ocupante" vs "Ya fue ocupada".
- Si no hay registros, mostrar un mensaje amigable en vez de una lista vacía.

---

## Épica 4 — Pestaña "Personas que necesitan vivienda"

**Como** persona que ofrece alojamiento,
**quiero** ver la lista de familias que necesitan un lugar,
**para** poder contactarlas directamente.

### Contenido
- Título **"Lista de personas que necesitan vivienda"** + lista de todos los registros del Formulario 2.
- Cada elemento clicable (no editable) abre el detalle completo.
- Indicador visual de estado: "Buscando alojamiento" vs "Ya encontró alojamiento".

---

## Épica 5 — Pestaña "Refugio para Mascotas"

**Como** persona con o sin mascota afectada por la emergencia,
**quiero** ver refugios disponibles y mascotas que necesitan refugio,
**para** coordinar ayuda animal.

### Contenido (en este orden)
1. Título **"Refugios para mascotas"** + lista de registros del Formulario 4.
2. Título **"Mascotas que necesitan refugio"** + lista de registros del Formulario 5.
- Cada elemento clicable (no editable) abre el detalle completo.

---

## Requerimientos técnicos sugeridos

- **Frontend:** HTML, CSS y JavaScript. No requiere backend propio si se usa una capa de almacenamiento clave-valor compartida (ej. `localStorage` no sirve porque no es compartido entre usuarios — se necesita una base de datos remota simple, tipo Firebase Firestore, Supabase, o un backend propio con una API REST mínima).
- **Persistencia de datos:** todos los registros deben guardarse en un almacenamiento **compartido** (mismo dato visible para todos los usuarios del enlace), no en el navegador de cada persona.
- **Imágenes:** si se permite foto en el Formulario 1, comprimir la imagen en el cliente antes de subirla (para no saturar el almacenamiento ni la conexión de la zona afectada).
- **Diseño:** mobile-first, botones grandes y fáciles de tocar, alto contraste, textos claros sin tecnicismos.
- **Accesibilidad:** tamaños de fuente legibles, foco visible en campos de formulario, funcione sin necesidad de zoom.

## Fuera de alcance (por ahora)
- Autenticación de usuarios.
- Edición o eliminación de registros por parte de terceros.
- Moderación automática de contenido (se recomienda revisión manual periódica del equipo coordinador para evitar registros falsos o duplicados).
- Georreferenciación en mapa (posible mejora futura).

---

## Prototipo de referencia
Ya existe un prototipo funcional en HTML/CSS/JS con esta misma estructura y campos, que el equipo puede usar como referencia visual y de comportamiento antes de definir la arquitectura final del backend.
