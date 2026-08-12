const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { initDB, query } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// BUG-002: la clave admin da acceso a eliminar cualquier registro. En producción debe
// venir siempre del entorno y nunca puede quedarse en un valor por defecto conocido.
const CLAVES_DEBILES = ['admin123', 'admin', 'password', 'changeme', '123456'];
const ADMIN_PASSWORD = resolveAdminPassword();

function resolveAdminPassword() {
  const fromEnv = process.env.ADMIN_PASSWORD;

  if (IS_PRODUCTION) {
    if (!fromEnv) {
      throw new Error(
        'ADMIN_PASSWORD no está definida y NODE_ENV=production.\n' +
        'Defínela en las variables de entorno del host antes de desplegar.\n' +
        'Genera una con: node -e "console.log(require(\'crypto\').randomBytes(24).toString(\'hex\'))"'
      );
    }
    if (CLAVES_DEBILES.includes(fromEnv.toLowerCase())) {
      throw new Error(
        `ADMIN_PASSWORD tiene un valor por defecto conocido ("${fromEnv}"). ` +
        'Cámbiala antes de exponer la plataforma en internet.'
      );
    }
    if (fromEnv.length < 12) {
      throw new Error(
        `ADMIN_PASSWORD es demasiado corta (${fromEnv.length} caracteres). Mínimo 12 en producción.`
      );
    }
    return fromEnv;
  }

  if (!fromEnv) {
    console.warn('ADMIN_PASSWORD no definida — usando clave de desarrollo "admin123". NO usar en producción.');
    return 'admin123';
  }
  return fromEnv;
}

// Middlewares globales
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Servir frontend estático
app.use(express.static(path.join(__dirname, '..', 'public')));

// Configuración Multer en memoria
const upload = multer({
  limits: { fileSize: 15 * 1024 * 1024 }, // Máximo 15MB
});

// Middleware de Limite de Tasa General (Anti-Spam)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Demasiadas peticiones desde esta dirección IP.' },
});
app.use('/api/', generalLimiter);

// Detección de anomalías en ráfagas (Subidas masivas)
const submissionTracker = new Map();

function detectAnomaly(ip) {
  const now = Date.now();
  const history = submissionTracker.get(ip) || [];
  const recentHistory = history.filter(time => now - time < 5 * 60 * 1000); // 5 min
  recentHistory.push(now);
  submissionTracker.set(ip, recentHistory);
  // Si envía más de 3 registros en 5 minutos, se marca como sospechoso
  return recentHistory.length > 3;
}

// Validación de Número Telefónico Colombiano
function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 7 && cleaned.length <= 12;
}

// Helper para procesar imagen con Sharp (WebP 82/100, strip EXIF GPS, min 500px)
async function processImageBuffer(buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    
    // Formatos permitidos: jpeg, png, webp, avif, gif, tiff
    const allowedFormats = ['jpeg', 'png', 'webp', 'avif', 'gif', 'tiff', 'heif', 'jpg'];
    if (!metadata || !allowedFormats.includes((metadata.format || '').toLowerCase())) {
      throw new Error('Formato de imagen no soportado. Use JPEG, PNG, WebP, AVIF, GIF o TIFF.');
    }

    // Validación de dimensiones mínimas: 500px por lado
    if ((metadata.width && metadata.width < 500) || (metadata.height && metadata.height < 500)) {
      throw new Error('La imagen es demasiado pequeña. Debe tener al menos 500 píxeles por lado.');
    }

    // Redimensionar proporcionalmente a ~720x1008 y convertir a WebP (82/100) sin EXIF
    const webpBuffer = await sharp(buffer)
      .rotate() // Auto-rotar según orientación de la cámara
      .resize(720, 1008, { fit: 'cover', position: 'center' })
      .webp({ quality: 82 })
      .toBuffer();

    return `data:image/webp;base64,${webpBuffer.toString('base64')}`;
  } catch (err) {
    throw err;
  }
}

// Middleware de Autenticación de Administrador
function requireAdmin(req, res, next) {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Clave de administración incorrecta o no autorizada.' });
  }
  next();
}

// BUG-003: los listados públicos nunca deben exponer el owner_token. Si viaja al cliente,
// cualquiera puede copiarlo y hacerse pasar por el autor del registro.
function sinDatosPrivados(rows) {
  return rows.map(({ owner_token, ...publico }) => publico);
}

// ===== API ENDPOINTS =====

// Healthcheck de Docker
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Stats para Banner Principal
app.get('/api/stats', async (req, res) => {
  try {
    const viviendas = await query(`SELECT COUNT(*) as count FROM vivienda WHERE estado = 'Busca ocupante' AND sospechoso = false`);
    const necesidades = await query(`SELECT COUNT(*) as count FROM necesidad_vivienda WHERE estado = 'Buscando alojamiento' AND sospechoso = false`);
    
    const countV = parseInt(viviendas[0]?.count || 0, 10);
    const countN = parseInt(necesidades[0]?.count || 0, 10);
    
    res.json({ viviendas: countV, necesidades: countN });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

// ===== 1. VIVIENDAS =====
// El listado NO incluye las fotos. Antes hacía LEFT JOIN foto y devolvía el data URI
// base64 completo de cada vivienda (~80 KB por registro): con 30 viviendas eran ~2,4 MB
// en cada carga de la pestaña, para usuarios que a menudo navegan con datos limitados.
// Las imágenes se piden ahora una a una por GET /api/viviendas/:id/foto, y sólo cuando
// entran en pantalla (loading="lazy" en el cliente). El campo `foto_id` que ya viaja en
// `v.*` indica si hay foto que pedir.
app.get('/api/viviendas', async (req, res) => {
  try {
    const rows = await query(`
      SELECT v.*
      FROM vivienda v
      WHERE v.sospechoso = false
      ORDER BY v.fecha_registro DESC
    `);
    res.json(sinDatosPrivados(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sirve la foto de una vivienda como WebP binario, no como base64. Además de sacarla del
// listado, transmitir los bytes crudos ahorra el ~33 % de sobrecarga que añade base64.
app.get('/api/viviendas/:id/foto', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query(
      `SELECT f.imagen_base64
       FROM vivienda v
       JOIN foto f ON v.foto_id = f.id
       WHERE v.id = $1 AND v.sospechoso = false`,
      [id]
    );

    if (!rows.length || !rows[0].imagen_base64) {
      return res.status(404).json({ error: 'Foto no encontrada.' });
    }

    // La columna guarda un data URI ("data:image/webp;base64,...."); se extraen los bytes.
    const base64 = String(rows[0].imagen_base64).replace(/^data:image\/[\w+.-]+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    // Las fotos son inmutables: el Project Brief no permite editar un registro una vez
    // enviado, así que el navegador puede cachearlas indefinidamente.
    res.set('Content-Type', 'image/webp');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.set('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/viviendas', upload.single('foto'), async (req, res) => {
  try {
    const { tipo, ciudad, barrio, capacidad, detalles, nombre_encargado, contacto, owner_token, honeypot } = req.body;
    
    // Honeypot anti-bot silencioso
    if (honeypot) {
      return res.status(200).json({ success: true, message: 'Registro recibido.' });
    }

    if (!tipo || !ciudad || !barrio || !capacidad || !nombre_encargado || !contacto) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados.' });
    }

    if (!isValidPhone(contacto)) {
      return res.status(400).json({ error: 'El número de contacto no es válido. Debe tener entre 7 y 12 dígitos.' });
    }

    const clientIp = req.ip || req.connection.remoteAddress;
    const isAnomaly = detectAnomaly(clientIp);

    const viviendaId = uuidv4();
    let fotoId = null;

    if (req.file) {
      const base64Webp = await processImageBuffer(req.file.buffer);
      fotoId = uuidv4();
      await query(
        `INSERT INTO foto (id, vivienda_id, imagen_base64) VALUES ($1, $2, $3)`,
        [fotoId, viviendaId, base64Webp]
      );
    }

    await query(
      `INSERT INTO vivienda (id, tipo, ciudad, barrio, capacidad, detalles, nombre_encargado, contacto, foto_id, estado, owner_token, sospechoso)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Busca ocupante', $10, $11)`,
      [viviendaId, tipo, ciudad, barrio, capacidad, detalles || '', nombre_encargado, contacto, fotoId, owner_token || uuidv4(), isAnomaly]
    );

    res.status(201).json({ success: true, id: viviendaId, sospechoso: isAnomaly });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Estados válidos por entidad (MUST-HAVE #4 del Project Brief)
const ESTADOS_VIVIENDA = ['Busca ocupante', 'Ya fue ocupada'];
const ESTADOS_NECESIDAD = ['Buscando alojamiento', 'Ya encontró alojamiento'];

// BUG-003: solo el autor del registro (owner_token) o un admin pueden cambiar el estado.
function esAdmin(req) {
  return req.headers['x-admin-key'] === ADMIN_PASSWORD;
}

app.patch('/api/viviendas/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, owner_token } = req.body;

    if (!ESTADOS_VIVIENDA.includes(estado)) {
      return res.status(400).json({
        error: `Estado inválido. Valores permitidos: ${ESTADOS_VIVIENDA.join(' | ')}.`
      });
    }

    // Se valida el token local de autoría o admin
    const current = await query(`SELECT owner_token FROM vivienda WHERE id = $1`, [id]);
    if (!current.length) return res.status(404).json({ error: 'Vivienda no encontrada.' });

    if (!esAdmin(req) && (!owner_token || current[0].owner_token !== owner_token)) {
      return res.status(403).json({
        error: 'Solo quien publicó este registro puede cambiar su estado.'
      });
    }

    await query(`UPDATE vivienda SET estado = $1 WHERE id = $2`, [estado, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ===== 2. NECESIDAD VIVIENDA =====
app.get('/api/necesidades-vivienda', async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM necesidad_vivienda WHERE sospechoso = false ORDER BY fecha_registro DESC`);
    res.json(sinDatosPrivados(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/necesidades-vivienda', async (req, res) => {
  try {
    const { nombre_familia, contacto, ciudad, cantidad_personas, condicion_especial, descripcion_condicion, descripcion_vivienda_necesita, owner_token, honeypot } = req.body;
    
    if (honeypot) return res.status(200).json({ success: true });

    if (!nombre_familia || !contacto || !ciudad || !cantidad_personas || !descripcion_vivienda_necesita) {
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }

    if (!isValidPhone(contacto)) {
      return res.status(400).json({ error: 'Número de contacto inválido.' });
    }

    const clientIp = req.ip || req.connection.remoteAddress;
    const isAnomaly = detectAnomaly(clientIp);

    const id = uuidv4();
    const condEspecialBool = condicion_especial === true || condicion_especial === 'true';

    await query(
      `INSERT INTO necesidad_vivienda (id, nombre_familia, contacto, ciudad, cantidad_personas, condicion_especial, descripcion_condicion, descripcion_vivienda_necesita, estado, owner_token, sospechoso)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Buscando alojamiento', $9, $10)`,
      [id, nombre_familia, contacto, ciudad, cantidad_personas, condEspecialBool, descripcion_condicion || '', descripcion_vivienda_necesita, owner_token || uuidv4(), isAnomaly]
    );

    res.status(201).json({ success: true, id, sospechoso: isAnomaly });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/necesidades-vivienda/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, owner_token } = req.body;

    if (!ESTADOS_NECESIDAD.includes(estado)) {
      return res.status(400).json({
        error: `Estado inválido. Valores permitidos: ${ESTADOS_NECESIDAD.join(' | ')}.`
      });
    }

    // BUG-003: este endpoint ni siquiera leía el owner_token antes de actualizar.
    const current = await query(`SELECT owner_token FROM necesidad_vivienda WHERE id = $1`, [id]);
    if (!current.length) return res.status(404).json({ error: 'Solicitud no encontrada.' });

    if (!esAdmin(req) && (!owner_token || current[0].owner_token !== owner_token)) {
      return res.status(403).json({
        error: 'Solo quien publicó esta solicitud puede cambiar su estado.'
      });
    }

    await query(`UPDATE necesidad_vivienda SET estado = $1 WHERE id = $2`, [estado, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ===== 3. CENTROS DE ACOPIO =====
app.get('/api/centros-acopio', async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM centro_acopio WHERE sospechoso = false ORDER BY fecha_registro DESC`);
    res.json(sinDatosPrivados(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/centros-acopio', async (req, res) => {
  try {
    const { ciudad, sector, direccion, contacto, owner_token, honeypot } = req.body;
    if (honeypot) return res.status(200).json({ success: true });

    if (!ciudad || !sector || !direccion || !contacto) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }
    if (!isValidPhone(contacto)) {
      return res.status(400).json({ error: 'Número de contacto inválido.' });
    }

    const isAnomaly = detectAnomaly(req.ip);
    const id = uuidv4();
    await query(
      `INSERT INTO centro_acopio (id, ciudad, sector, direccion, contacto, owner_token, sospechoso) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, ciudad, sector, direccion, contacto, owner_token || uuidv4(), isAnomaly]
    );
    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ===== 4. REFUGIOS MASCOTA =====
app.get('/api/refugios-mascota', async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM refugio_mascota WHERE sospechoso = false ORDER BY fecha_registro DESC`);
    res.json(sinDatosPrivados(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/refugios-mascota', async (req, res) => {
  try {
    const { tipo_mascota, ciudad, sector, direccion, contacto, owner_token, honeypot } = req.body;
    if (honeypot) return res.status(200).json({ success: true });

    if (!tipo_mascota || !ciudad || !sector || !direccion || !contacto) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }
    if (!isValidPhone(contacto)) {
      return res.status(400).json({ error: 'Número de contacto inválido.' });
    }

    const isAnomaly = detectAnomaly(req.ip);
    const id = uuidv4();
    await query(
      `INSERT INTO refugio_mascota (id, tipo_mascota, ciudad, sector, direccion, contacto, owner_token, sospechoso) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, tipo_mascota, ciudad, sector, direccion, contacto, owner_token || uuidv4(), isAnomaly]
    );
    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ===== 5. NECESIDAD MASCOTA =====
app.get('/api/necesidades-mascota', async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM necesidad_mascota WHERE sospechoso = false ORDER BY fecha_registro DESC`);
    res.json(sinDatosPrivados(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/necesidades-mascota', async (req, res) => {
  try {
    const { nombre_encargado, contacto, tipo_mascota, cantidad_mascotas, owner_token, honeypot } = req.body;
    if (honeypot) return res.status(200).json({ success: true });

    if (!nombre_encargado || !contacto || !tipo_mascota || !cantidad_mascotas) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }
    if (!isValidPhone(contacto)) {
      return res.status(400).json({ error: 'Número de contacto inválido.' });
    }

    const isAnomaly = detectAnomaly(req.ip);
    const id = uuidv4();
    await query(
      `INSERT INTO necesidad_mascota (id, nombre_encargado, contacto, tipo_mascota, cantidad_mascotas, owner_token, sospechoso) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, nombre_encargado, contacto, tipo_mascota, cantidad_mascotas, owner_token || uuidv4(), isAnomaly]
    );
    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ===== REPORTE COMUNITARIO (ANTI-SPAM) =====
app.post('/api/reportar/:tipo/:id', async (req, res) => {
  try {
    const { tipo, id } = req.params;
    const tableMap = {
      vivienda: 'vivienda',
      necesidad_vivienda: 'necesidad_vivienda',
      centro_acopio: 'centro_acopio',
      refugio_mascota: 'refugio_mascota',
      necesidad_mascota: 'necesidad_mascota'
    };

    const tableName = tableMap[tipo];
    if (!tableName) return res.status(400).json({ error: 'Tipo inválido.' });

    await query(`UPDATE ${tableName} SET reportes_count = reportes_count + 1 WHERE id = $1`, [id]);
    
    // Si alcanza 3 reportes, se marca como sospechoso automáticamente
    await query(`UPDATE ${tableName} SET sospechoso = true WHERE id = $1 AND reportes_count >= 3`, [id]);

    res.json({ success: true, message: 'Reporte registrado. Gracias por colaborar con la comunidad.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ADMIN ENDPOINTS SECRETO =====

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, key: ADMIN_PASSWORD });
  } else {
    res.status(401).json({ error: 'Contraseña de administración incorrecta.' });
  }
});

app.get('/api/admin/registros', requireAdmin, async (req, res) => {
  try {
    const viviendas = await query(`SELECT 'vivienda' as entidad_tipo, * FROM vivienda ORDER BY fecha_registro DESC`);
    const necesidades = await query(`SELECT 'necesidad_vivienda' as entidad_tipo, * FROM necesidad_vivienda ORDER BY fecha_registro DESC`);
    const centros = await query(`SELECT 'centro_acopio' as entidad_tipo, * FROM centro_acopio ORDER BY fecha_registro DESC`);
    const refugios = await query(`SELECT 'refugio_mascota' as entidad_tipo, * FROM refugio_mascota ORDER BY fecha_registro DESC`);
    const necMascotas = await query(`SELECT 'necesidad_mascota' as entidad_tipo, * FROM necesidad_mascota ORDER BY fecha_registro DESC`);

    res.json({
      viviendas,
      necesidades,
      centros,
      refugios,
      necMascotas
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/eliminar/:tipo/:id', requireAdmin, async (req, res) => {
  try {
    const { tipo, id } = req.params;
    const tableMap = {
      vivienda: 'vivienda',
      necesidad_vivienda: 'necesidad_vivienda',
      centro_acopio: 'centro_acopio',
      refugio_mascota: 'refugio_mascota',
      necesidad_mascota: 'necesidad_mascota'
    };
    const tableName = tableMap[tipo];
    if (!tableName) return res.status(400).json({ error: 'Tipo inválido.' });

    await query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Registro eliminado exitosamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/aprobar/:tipo/:id', requireAdmin, async (req, res) => {
  try {
    const { tipo, id } = req.params;
    const tableMap = {
      vivienda: 'vivienda',
      necesidad_vivienda: 'necesidad_vivienda',
      centro_acopio: 'centro_acopio',
      refugio_mascota: 'refugio_mascota',
      necesidad_mascota: 'necesidad_mascota'
    };
    const tableName = tableMap[tipo];
    if (!tableName) return res.status(400).json({ error: 'Tipo inválido.' });

    await query(`UPDATE ${tableName} SET sospechoso = false, reportes_count = 0 WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Registro aprobado y verificado.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Inicialización del servidor HTTP
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
  });
}).catch(err => {
  // BUG-001: salir con código 1 para que el orquestador (Docker/Render/Fly) marque el
  // despliegue como fallido. Antes solo se registraba el error y el contenedor quedaba
  // vivo sin servidor escuchando, ocultando el problema.
  console.error('\n❌ Error fatal al inicializar la base de datos:\n');
  console.error(err.message);
  process.exit(1);
});
