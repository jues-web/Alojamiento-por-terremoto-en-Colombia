const { Pool } = require('pg');

// ADR-009: la plataforma usa PostgreSQL como único motor. El fallback a SQLite que definía
// el ADR-001 se retiró: obligaba a mantener el esquema duplicado a mano, dejaba una capa de
// traducción de placeholders y hacía que el desarrollo se probara contra un motor distinto
// del de producción. El desarrollo local usa ahora `docker compose up` o una rama de Neon.
let pgPool = null;

async function initDB() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL no está definida.\n' +
      'PostgreSQL es obligatorio: ya no existe fallback a SQLite (ADR-009).\n' +
      '  · Local:      docker compose up -d db   (y copia .env.example a .env)\n' +
      '  · Neon/nube:  añade ?sslmode=require al final de la cadena de conexión'
    );
  }

  pgPool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5000,
  });

  try {
    // Se prueba la conexión antes de seguir, para fallar con un mensaje claro y no
    // más tarde en la primera petición del usuario.
    const client = await pgPool.connect();
    console.log('Conectado exitosamente a PostgreSQL');
    client.release();
  } catch (err) {
    throw new Error(
      `No se pudo conectar a PostgreSQL: ${err.message}\n` +
      'Revisa DATABASE_URL (host, credenciales y sslmode).'
    );
  }

  await createTables();
}

// ===== ESQUEMA =====
// No hay sistema de migraciones: las tablas se crean con CREATE TABLE IF NOT EXISTS en cada
// arranque. Añadir una columna aquí NO la agrega a una base de datos que ya existe; eso
// requiere un ALTER TABLE manual contra la instancia correspondiente.
async function createTables() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS vivienda (
      id UUID PRIMARY KEY,
      tipo VARCHAR(50) NOT NULL,
      ciudad VARCHAR(100) NOT NULL,
      barrio VARCHAR(150) NOT NULL,
      capacidad VARCHAR(50) NOT NULL,
      detalles TEXT,
      nombre_encargado VARCHAR(150) NOT NULL,
      contacto VARCHAR(50) NOT NULL,
      foto_id UUID,
      estado VARCHAR(50) NOT NULL DEFAULT 'Busca ocupante',
      fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      owner_token VARCHAR(100),
      reportes_count INT DEFAULT 0,
      sospechoso BOOLEAN DEFAULT FALSE
    );`,

    `CREATE TABLE IF NOT EXISTS necesidad_vivienda (
      id UUID PRIMARY KEY,
      nombre_familia VARCHAR(150) NOT NULL,
      contacto VARCHAR(50) NOT NULL,
      ciudad VARCHAR(100) NOT NULL,
      cantidad_personas VARCHAR(50) NOT NULL,
      condicion_especial BOOLEAN NOT NULL DEFAULT FALSE,
      descripcion_condicion TEXT,
      descripcion_vivienda_necesita TEXT NOT NULL,
      estado VARCHAR(50) NOT NULL DEFAULT 'Buscando alojamiento',
      fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      owner_token VARCHAR(100),
      reportes_count INT DEFAULT 0,
      sospechoso BOOLEAN DEFAULT FALSE
    );`,

    `CREATE TABLE IF NOT EXISTS centro_acopio (
      id UUID PRIMARY KEY,
      ciudad VARCHAR(100) NOT NULL,
      sector VARCHAR(150) NOT NULL,
      direccion VARCHAR(200) NOT NULL,
      contacto VARCHAR(50) NOT NULL,
      fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      owner_token VARCHAR(100),
      reportes_count INT DEFAULT 0,
      sospechoso BOOLEAN DEFAULT FALSE
    );`,

    `CREATE TABLE IF NOT EXISTS refugio_mascota (
      id UUID PRIMARY KEY,
      tipo_mascota VARCHAR(50) NOT NULL,
      ciudad VARCHAR(100) NOT NULL,
      sector VARCHAR(150) NOT NULL,
      direccion VARCHAR(200) NOT NULL,
      contacto VARCHAR(50) NOT NULL,
      fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      owner_token VARCHAR(100),
      reportes_count INT DEFAULT 0,
      sospechoso BOOLEAN DEFAULT FALSE
    );`,

    `CREATE TABLE IF NOT EXISTS necesidad_mascota (
      id UUID PRIMARY KEY,
      nombre_encargado VARCHAR(150) NOT NULL,
      contacto VARCHAR(50) NOT NULL,
      tipo_mascota VARCHAR(50) NOT NULL,
      cantidad_mascotas VARCHAR(50) NOT NULL,
      fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      owner_token VARCHAR(100),
      reportes_count INT DEFAULT 0,
      sospechoso BOOLEAN DEFAULT FALSE
    );`,

    `CREATE TABLE IF NOT EXISTS foto (
      id UUID PRIMARY KEY,
      vivienda_id UUID NOT NULL,
      imagen_base64 TEXT NOT NULL,
      fecha_carga TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS ip_registry (
      ip VARCHAR(45) PRIMARY KEY,
      post_count INT DEFAULT 0,
      is_blocked BOOLEAN DEFAULT FALSE,
      is_allowed_by_admin BOOLEAN DEFAULT FALSE,
      limite_alcanzado BOOLEAN DEFAULT FALSE,
      last_used TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    // Migración segura para bases de datos existentes que ya tienen la tabla sin la columna.
    // ALTER TABLE ... IF NOT EXISTS solo está disponible en PostgreSQL 9.6+.
    `ALTER TABLE ip_registry ADD COLUMN IF NOT EXISTS limite_alcanzado BOOLEAN DEFAULT FALSE;`,

    // Guarda la IP que creó cada publicación, para que el panel admin pueda mostrar qué
    // publicó una IP sospechosa antes de decidir si bloquearla. Hasta ahora `ip_registry`
    // sólo contaba publicaciones por IP, sin ningún vínculo con los registros concretos.
    // Los registros creados antes de esta columna quedan con `ip` a NULL: no es posible
    // reconstruir ese dato retroactivamente.
    `ALTER TABLE vivienda           ADD COLUMN IF NOT EXISTS ip VARCHAR(45);`,
    `ALTER TABLE necesidad_vivienda ADD COLUMN IF NOT EXISTS ip VARCHAR(45);`,
    `ALTER TABLE centro_acopio      ADD COLUMN IF NOT EXISTS ip VARCHAR(45);`,
    `ALTER TABLE refugio_mascota    ADD COLUMN IF NOT EXISTS ip VARCHAR(45);`,
    `ALTER TABLE necesidad_mascota  ADD COLUMN IF NOT EXISTS ip VARCHAR(45);`,

    // Los refugios de mascotas también pueden tener foto, igual que las viviendas. La tabla
    // `foto` se reutiliza: `vivienda_id` pasa a ser opcional porque una foto ahora puede
    // pertenecer a un refugio en su lugar. El vínculo se hace por `refugio_mascota.foto_id`.
    `ALTER TABLE refugio_mascota ADD COLUMN IF NOT EXISTS foto_id UUID;`,
    `ALTER TABLE foto ALTER COLUMN vivienda_id DROP NOT NULL;`,

    `CREATE INDEX IF NOT EXISTS idx_vivienda_ip ON vivienda(ip);`,
    `CREATE INDEX IF NOT EXISTS idx_necesidad_vivienda_ip ON necesidad_vivienda(ip);`,
    `CREATE INDEX IF NOT EXISTS idx_centro_acopio_ip ON centro_acopio(ip);`,
    `CREATE INDEX IF NOT EXISTS idx_refugio_mascota_ip ON refugio_mascota(ip);`,
    `CREATE INDEX IF NOT EXISTS idx_necesidad_mascota_ip ON necesidad_mascota(ip);`,

    `CREATE INDEX IF NOT EXISTS idx_vivienda_ciudad ON vivienda(ciudad);`,
    `CREATE INDEX IF NOT EXISTS idx_vivienda_estado ON vivienda(estado);`,
    `CREATE INDEX IF NOT EXISTS idx_necesidad_ciudad ON necesidad_vivienda(ciudad);`
  ];

  for (const q of queries) {
    await pgPool.query(q);
  }
}

// ===== QUERY =====
// Las consultas usan placeholders nativos de PostgreSQL ($1, $2...). Antes se escribían
// con `?` y se traducían aquí con un replace global, herencia de SQLite; ese replace no
// distinguía un `?` real de uno dentro de un literal de texto.
// Devuelve siempre un array de filas: [] en las escrituras sin RETURNING.
async function query(sql, params = []) {
  const res = await pgPool.query(sql, params);
  return res.rows;
}

module.exports = {
  initDB,
  query,
};
