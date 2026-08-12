const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let isPostgres = false;
let pgPool = null;
let sqliteDb = null;

const databaseUrl = process.env.DATABASE_URL;

async function initDB() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (databaseUrl) {
    try {
      pgPool = new Pool({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 5000,
      });

      // Probamos la conexión
      const client = await pgPool.connect();
      console.log('Conectado exitosamente a PostgreSQL');
      client.release();
      isPostgres = true;
      await createPostgresTables();
      return;
    } catch (err) {
      // BUG-001: en producción NO se degrada a SQLite. El archivo data.db vive en el
      // disco efímero del contenedor, así que la app arrancaría "sana" y perdería todos
      // los registros en cada reinicio o redespliegue, sin ningún error visible.
      if (isProduction) {
        throw new Error(
          `No se pudo conectar a PostgreSQL en producción: ${err.message}\n` +
          `Revisa DATABASE_URL (host, credenciales y sslmode). El fallback a SQLite está\n` +
          `deshabilitado en producción porque los datos se perderían en cada reinicio.`
        );
      }
      console.warn('No se pudo conectar a PostgreSQL, usando fallback SQLite local:', err.message);
    }
  } else if (isProduction) {
    // BUG-001: sin DATABASE_URL en producción los listados dejarían de ser públicos
    // y compartidos (MUST-HAVE #2 del Project Brief).
    throw new Error(
      'DATABASE_URL no está definida y NODE_ENV=production.\n' +
      'La plataforma exige PostgreSQL en producción: los listados deben ser compartidos\n' +
      'entre todos los visitantes, no locales al contenedor.'
    );
  }

  // Fallback a SQLite (solo desarrollo)
  console.log('Inicializando base de datos SQLite local (data.db)');
  const dbPath = path.join(__dirname, '..', 'data.db');
  sqliteDb = new sqlite3.Database(dbPath);
  isPostgres = false;
  await createSqliteTables();
}

// ===== POSTGRESQL TABLES =====
async function createPostgresTables() {
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

    `CREATE INDEX IF NOT EXISTS idx_vivienda_ciudad ON vivienda(ciudad);`,
    `CREATE INDEX IF NOT EXISTS idx_vivienda_estado ON vivienda(estado);`,
    `CREATE INDEX IF NOT EXISTS idx_necesidad_ciudad ON necesidad_vivienda(ciudad);`
  ];

  for (const q of queries) {
    await pgPool.query(q);
  }
}

// ===== SQLITE TABLES =====
function createSqliteTables() {
  return new Promise((resolve, reject) => {
    sqliteDb.serialize(() => {
      sqliteDb.run(`CREATE TABLE IF NOT EXISTS vivienda (
        id TEXT PRIMARY KEY,
        tipo TEXT NOT NULL,
        ciudad TEXT NOT NULL,
        barrio TEXT NOT NULL,
        capacidad TEXT NOT NULL,
        detalles TEXT,
        nombre_encargado TEXT NOT NULL,
        contacto TEXT NOT NULL,
        foto_id TEXT,
        estado TEXT NOT NULL DEFAULT 'Busca ocupante',
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        owner_token TEXT,
        reportes_count INTEGER DEFAULT 0,
        sospechoso INTEGER DEFAULT 0
      )`);

      sqliteDb.run(`CREATE TABLE IF NOT EXISTS necesidad_vivienda (
        id TEXT PRIMARY KEY,
        nombre_familia TEXT NOT NULL,
        contacto TEXT NOT NULL,
        ciudad TEXT NOT NULL,
        cantidad_personas TEXT NOT NULL,
        condicion_especial INTEGER DEFAULT 0,
        descripcion_condicion TEXT,
        descripcion_vivienda_necesita TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'Buscando alojamiento',
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        owner_token TEXT,
        reportes_count INTEGER DEFAULT 0,
        sospechoso INTEGER DEFAULT 0
      )`);

      sqliteDb.run(`CREATE TABLE IF NOT EXISTS centro_acopio (
        id TEXT PRIMARY KEY,
        ciudad TEXT NOT NULL,
        sector TEXT NOT NULL,
        direccion TEXT NOT NULL,
        contacto TEXT NOT NULL,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        owner_token TEXT,
        reportes_count INTEGER DEFAULT 0,
        sospechoso INTEGER DEFAULT 0
      )`);

      sqliteDb.run(`CREATE TABLE IF NOT EXISTS refugio_mascota (
        id TEXT PRIMARY KEY,
        tipo_mascota TEXT NOT NULL,
        ciudad TEXT NOT NULL,
        sector TEXT NOT NULL,
        direccion TEXT NOT NULL,
        contacto TEXT NOT NULL,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        owner_token TEXT,
        reportes_count INTEGER DEFAULT 0,
        sospechoso INTEGER DEFAULT 0
      )`);

      sqliteDb.run(`CREATE TABLE IF NOT EXISTS necesidad_mascota (
        id TEXT PRIMARY KEY,
        nombre_encargado TEXT NOT NULL,
        contacto TEXT NOT NULL,
        tipo_mascota TEXT NOT NULL,
        cantidad_mascotas TEXT NOT NULL,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        owner_token TEXT,
        reportes_count INTEGER DEFAULT 0,
        sospechoso INTEGER DEFAULT 0
      )`);

      sqliteDb.run(`CREATE TABLE IF NOT EXISTS foto (
        id TEXT PRIMARY KEY,
        vivienda_id TEXT NOT NULL,
        imagen_base64 TEXT NOT NULL,
        fecha_carga DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

// ===== UNIVERSAL QUERY HELPER =====
async function query(sql, params = []) {
  if (isPostgres) {
    // Reemplazar ? con $1, $2 en Postgres SQL
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    const res = await pgPool.query(pgSql, params);
    return res.rows;
  } else {
    return new Promise((resolve, reject) => {
      const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
      if (isSelect) {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      } else {
        sqliteDb.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      }
    });
  }
}

module.exports = {
  initDB,
  query,
  getIsPostgres: () => isPostgres
};
