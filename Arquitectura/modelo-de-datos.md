Aquí tienes el modelo de datos, adaptado a las 5 entidades de tu página. Como definimos en el "NO ES" que no hay login ni sistema de verificación, no existe una entidad Usuario — cada registro es independiente y se identifica solo por su contacto.

---

*ENTIDAD: Vivienda*
- id: uuid (PK)
- tipo: enum[Casa, Bodega, Apartamento, Habitación] (not null)
- ciudad: enum[Manizales, Pereira, Cali, Quibdó, Armenia] (not null)
- barrio: string (not null)
- capacidad: enum[Una, Dos, Tres, Cuatro, Más de cuatro] (not null)
- detalles: text (nullable)
- nombre_encargado: string (not null)
- contacto: string (not null)
- foto_id: uuid (FK -> Foto, nullable)
- estado: enum[Busca ocupante, Ya fue ocupada] (not null, default: Busca ocupante)
- fecha_registro: timestamp (not null, default: now)

*ENTIDAD: NecesidadVivienda*
- id: uuid (PK)
- nombre_familia: string (not null)
- contacto: string (not null)
- ciudad: enum[Manizales, Pereira, Cali, Quibdó, Armenia, Otra] (not null)
- cantidad_personas: enum[Una, Dos, Tres, Cuatro, Más de cuatro] (not null)
- condicion_especial: boolean (not null, default: false)
- descripcion_condicion: text (nullable, requerido si condicion_especial = true)
- descripcion_vivienda_necesita: text (not null)
- estado: enum[Buscando alojamiento, Ya encontró alojamiento] (not null, default: Buscando alojamiento)
- fecha_registro: timestamp (not null, default: now)

*ENTIDAD: CentroAcopio*
- id: uuid (PK)
- ciudad: string (not null)
- sector: string (not null)
- direccion: string (not null)
- contacto: string (not null)
- fecha_registro: timestamp (not null, default: now)

*ENTIDAD: RefugioMascota*
- id: uuid (PK)
- tipo_mascota: enum[Perros, Gatos, Perros y gatos, Otros] (not null)
- ciudad: string (not null)
- sector: string (not null)
- direccion: string (not null)
- contacto: string (not null)
- fecha_registro: timestamp (not null, default: now)

*ENTIDAD: NecesidadMascota*
- id: uuid (PK)
- nombre_encargado: string (not null)
- contacto: string (not null)
- tipo_mascota: enum[Perro, Gato, Perros y gatos, Otros] (not null)
- cantidad_mascotas: enum[Una, Dos, Tres o más] (not null)
- fecha_registro: timestamp (not null, default: now)

*ENTIDAD: Foto*
- id: uuid (PK)
- vivienda_id: uuid (FK -> Vivienda, unique, not null)
- imagen_base64: text (not null)
- fecha_carga: timestamp (not null, default: now)

*RELACIONES:*

Vivienda --(1:1)--> Foto   [opcional: una vivienda puede no tener foto]

NecesidadVivienda   [entidad independiente, sin FK hacia Vivienda]
CentroAcopio        [entidad independiente]
RefugioMascota       [entidad independiente]
NecesidadMascota    [entidad independiente]


*Por qué no hay relaciones entre Vivienda y NecesidadVivienda (ni entre RefugioMascota y NecesidadMascota):* en el PRD dejamos explícito que la página no intermedia ni hace match automático — el contacto ocurre por fuera de la plataforma. Si en la sesión 3 alguien propone "agreguemos una tabla Match que conecte a quien ofrece con quien busca", eso ya es una feature nueva de matching que no estaba en el alcance original y que multiplicaría la complejidad (¿quién confirma el match? ¿qué pasa si dos familias piden la misma vivienda? ¿se necesita notificación?). Ese es exactamente el tipo de "candado" que el NO ES del brief debería frenar.

Una decisión que sí vale la pena confirmar contigo: guardar imagen_base64 directo en la base de datos funciona para el MVP, pero si crece mucho el volumen de fotos conviene moverlas a un storage de archivos (ej. S3, Supabase Storage) y dejar en Foto solo la URL. Para el lanzamiento inicial, base64 es suficiente y más simple de implementar.