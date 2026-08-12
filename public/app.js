// State & Storage
let activeTab = 'inicio';
let stats = { viviendas: 0, necesidades: 0 };
let adminKey = localStorage.getItem('admin_key') || '';

// Generar o recuperar token de autoría local
let ownerToken = localStorage.getItem('owner_token');
if (!ownerToken) {
  ownerToken = 'tok_' + Math.random().toString(36).substring(2) + Date.now();
  localStorage.setItem('owner_token', ownerToken);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  fetchStats();
  renderAlojamientos();
  renderNecesidades();
  renderMascotas();
});

// ===== NAVEGACIÓN POR PESTAÑAS =====
function switchTab(tabId) {
  activeTab = tabId;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));

  const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick').includes(tabId));
  if (activeBtn) activeBtn.classList.add('active');

  const viewEl = document.getElementById(`view-${tabId}`);
  if (viewEl) viewEl.classList.add('active');

  if (tabId === 'alojamientos') renderAlojamientos();
  if (tabId === 'necesidades') renderNecesidades();
  if (tabId === 'mascotas') renderMascotas();
  if (tabId === 'inicio') fetchStats();
}

// ===== STATS EN VIVO =====
async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    if (res.ok) {
      const data = await res.json();
      document.getElementById('stat-viviendas').innerText = data.viviendas;
      document.getElementById('stat-necesidades').innerText = data.necesidades;
    }
  } catch (err) {
    console.error('Error estadísticas:', err);
  }
}

// ===== HELPER TIEMPO RELATIVO =====
function getRelativeTime(timestamp) {
  if (!timestamp) return 'Recientemente';
  const now = new Date();
  const date = new Date(timestamp);
  const diffMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffMinutes < 1) return 'Hace un momento';
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
}

// ===== NOTIFICACIONES TOAST =====
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> <div>${message}</div>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// ===== MODALES Y FORMULARIOS =====
function openFormModal(formType) {
  const modal = document.getElementById('modal-form');
  const content = document.getElementById('modal-form-content');

  let html = '';
  if (formType === 1) html = getFormViviendaHTML();
  if (formType === 2) html = getFormNecesidadViviendaHTML();
  if (formType === 3) html = getFormCentroAcopioHTML();
  if (formType === 4) html = getFormRefugioMascotaHTML();
  if (formType === 5) html = getFormNecesidadMascotaHTML();

  content.innerHTML = html;
  modal.classList.add('active');
}

function closeFormModal() {
  document.getElementById('modal-form').classList.remove('active');
}

function closeDetailModal() {
  document.getElementById('modal-detail').classList.remove('active');
}

// Form HTML 1: Registrar Vivienda
function getFormViviendaHTML() {
  return `
    <h2>🏠 Registrar Vivienda para Alojamiento</h2>
    <form id="form-vivienda" onsubmit="submitVivienda(event)">
      <input type="text" name="honeypot" class="honeypot-field" tabindex="-1" autocomplete="off">
      
      <div class="form-group">
        <label>Tipo de Vivienda <span class="req">*</span></label>
        <select name="tipo" class="form-control" required>
          <option value="">Seleccione tipo...</option>
          <option value="Casa">Casa</option>
          <option value="Apartamento">Apartamento</option>
          <option value="Habitación">Habitación</option>
          <option value="Bodega">Bodega</option>
        </select>
      </div>

      <div class="form-group">
        <label>Ciudad <span class="req">*</span></label>
        <select name="ciudad" class="form-control" required>
          <option value="">Seleccione ciudad...</option>
          <option value="Manizales">Manizales</option>
          <option value="Pereira">Pereira</option>
          <option value="Cali">Cali</option>
          <option value="Quibdó">Quibdó</option>
          <option value="Armenia">Armenia</option>
        </select>
      </div>

      <div class="form-group">
        <label>Barrio o Localidad <span class="req">*</span></label>
        <input type="text" name="barrio" class="form-control" placeholder="Ej: Palermo / Centro" required>
      </div>

      <div class="form-group">
        <label>¿Cuántas personas puede albergar? <span class="req">*</span></label>
        <select name="capacidad" class="form-control" required>
          <option value="Una">Una persona</option>
          <option value="Dos">Dos personas</option>
          <option value="Tres">Tres personas</option>
          <option value="Cuatro">Cuatro personas</option>
          <option value="Más de cuatro">Más de cuatro personas</option>
        </select>
      </div>

      <div class="form-group">
        <label>Nombre del Encargado <span class="req">*</span></label>
        <input type="text" name="nombre_encargado" class="form-control" placeholder="Tu nombre" required>
      </div>

      <div class="form-group">
        <label>Teléfono de Contacto / WhatsApp <span class="req">*</span></label>
        <input type="tel" name="contacto" class="form-control" placeholder="Ej: 3101234567" required>
      </div>

      <div class="form-group">
        <label>Detalles adicionales (opcional)</label>
        <textarea name="detalles" class="form-control" placeholder="Disponibilidad, si permite mascotas, servicios de baño, etc."></textarea>
      </div>

      <div class="form-group">
        <label>Foto del espacio (opcional)</label>
        <input type="file" name="foto" accept="image/*" class="form-control">
        <small style="color:var(--text-soft)">Formatos: JPG, PNG, WebP, GIF, TIFF. Máx 15MB. Mínimo 500px por lado.</small>
      </div>

      <button type="submit" class="btn btn-primary" style="width:100%">Publicar Oferta de Alojamiento</button>
    </form>
  `;
}

// ===== ENVÍO DE FORMULARIOS (BUG-K001) =====

// BUG-K001: si la red se caía durante el envío, el usuario veía el mensaje crudo del
// navegador ("Failed to fetch", "NetworkError..."), en inglés y sin decirle qué hacer.
// En una zona de emergencia con cobertura intermitente ese es el caso más frecuente.
const MSG_SIN_CONEXION =
  'Sin conexión. Verifica tu internet e intenta de nuevo. Tus datos no se han perdido.';

// Envía un formulario y traduce cualquier fallo a un mensaje accionable en español.
// Devuelve la respuesta del servidor, o null si hubo error (ya notificado al usuario).
async function enviarFormulario(form, url, body, opciones = {}) {
  const boton = form.querySelector('button[type="submit"]');
  const textoOriginal = boton ? boton.innerHTML : '';

  // Bloquea el reenvío mientras la petición está en curso. Con conexión lenta el usuario
  // tiende a pulsar varias veces: además de duplicar registros, más de 3 envíos en 5
  // minutos disparan detectAnomaly() (ADR-005) y su propia publicación acaba en cuarentena.
  if (boton) {
    boton.disabled = true;
    boton.innerHTML = 'Enviando...';
  }

  const restaurarBoton = () => {
    if (boton) {
      boton.disabled = false;
      boton.innerHTML = textoOriginal;
    }
  };

  let res;
  try {
    res = await fetch(url, { method: 'POST', ...opciones, body });
  } catch (err) {
    // fetch solo lanza por fallo de red, DNS o CORS; nunca por un código HTTP de error.
    restaurarBoton();
    showToast(MSG_SIN_CONEXION, 'error');
    return null;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Se muestra el mensaje concreto del servidor ("Número de contacto inválido", etc.)
    // en lugar de un genérico, para que el usuario sepa qué corregir.
    restaurarBoton();
    showToast(data.error || 'No se pudo guardar el registro. Intenta de nuevo.', 'error');
    return null;
  }

  return data;
}

// Submit Vivienda
async function submitVivienda(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  formData.append('owner_token', ownerToken);

  // Sin cabecera Content-Type: el navegador la fija con el boundary del multipart.
  const data = await enviarFormulario(form, '/api/viviendas', formData);
  if (!data) return;

  showToast('¡Vivienda registrada exitosamente!');
  closeFormModal();
  fetchStats();
  renderAlojamientos();
}

// Form HTML 2: Necesito Vivienda
function getFormNecesidadViviendaHTML() {
  return `
    <h2>🆘 Solicitar Vivienda Temporal</h2>
    <form id="form-necesidad-vivienda" onsubmit="submitNecesidadVivienda(event)">
      <input type="text" name="honeypot" class="honeypot-field" tabindex="-1" autocomplete="off">

      <div class="form-group">
        <label>Nombre de la Familia o Encargado <span class="req">*</span></label>
        <input type="text" name="nombre_familia" class="form-control" placeholder="Ej: Familia Pérez" required>
      </div>

      <div class="form-group">
        <label>Teléfono de Contacto / WhatsApp <span class="req">*</span></label>
        <input type="tel" name="contacto" class="form-control" placeholder="Ej: 3201234567" required>
      </div>

      <div class="form-group">
        <label>Ciudad requerida <span class="req">*</span></label>
        <select name="ciudad" class="form-control" required>
          <option value="Manizales">Manizales</option>
          <option value="Pereira">Pereira</option>
          <option value="Cali">Cali</option>
          <option value="Quibdó">Quibdó</option>
          <option value="Armenia">Armenia</option>
          <option value="Otra">Otra</option>
        </select>
      </div>

      <div class="form-group">
        <label>¿Cuántas personas son? <span class="req">*</span></label>
        <select name="cantidad_personas" class="form-control" required>
          <option value="Una">Una persona</option>
          <option value="Dos">Dos personas</option>
          <option value="Tres">Tres personas</option>
          <option value="Cuatro">Cuatro personas</option>
          <option value="Más de cuatro">Más de cuatro personas</option>
        </select>
      </div>

      <div class="form-group">
        <label>¿Requiere condición especial? (Adultos mayores, bebés, movilidad reducida)</label>
        <select name="condicion_especial" class="form-control" onchange="toggleCondEspecial(this.value)">
          <option value="false">No</option>
          <option value="true">Sí</option>
        </select>
      </div>

      <div class="form-group" id="group-desc-condicion" style="display:none;">
        <label>Descripción de la condición especial <span class="req">*</span></label>
        <input type="text" name="descripcion_condicion" class="form-control" placeholder="Ej: Silla de ruedas, requiere primer piso">
      </div>

      <div class="form-group">
        <label>Descripción de la vivienda que necesitan <span class="req">*</span></label>
        <textarea name="descripcion_vivienda_necesita" class="form-control" placeholder="Sector preferido, urgencia, N.º de habitaciones..." required></textarea>
      </div>

      <button type="submit" class="btn btn-warning" style="width:100%">Publicar Solicitud de Vivienda</button>
    </form>
  `;
}

function toggleCondEspecial(val) {
  document.getElementById('group-desc-condicion').style.display = (val === 'true') ? 'block' : 'none';
}

async function submitNecesidadVivienda(event) {
  event.preventDefault();
  const form = event.target;
  const dataObj = Object.fromEntries(new FormData(form));
  dataObj.owner_token = ownerToken;

  const data = await enviarFormulario(form, '/api/necesidades-vivienda', JSON.stringify(dataObj), {
    headers: { 'Content-Type': 'application/json' }
  });
  if (!data) return;

  showToast('¡Solicitud publicada exitosamente!');
  closeFormModal();
  fetchStats();
  renderNecesidades();
}

// Form HTML 3: Centro de Acopio
function getFormCentroAcopioHTML() {
  return `
    <h2>📦 Registrar Centro de Acopio</h2>
    <form onsubmit="submitCentroAcopio(event)">
      <input type="text" name="honeypot" class="honeypot-field" tabindex="-1">
      <div class="form-group">
        <label>Ciudad <span class="req">*</span></label>
        <input type="text" name="ciudad" class="form-control" placeholder="Ej: Manizales" required>
      </div>
      <div class="form-group">
        <label>Sector / Barrio <span class="req">*</span></label>
        <input type="text" name="sector" class="form-control" placeholder="Ej: Coliseo Mayor" required>
      </div>
      <div class="form-group">
        <label>Dirección exacta <span class="req">*</span></label>
        <input type="text" name="direccion" class="form-control" placeholder="Ej: Cra 23 # 45-12" required>
      </div>
      <div class="form-group">
        <label>Teléfono de Contacto <span class="req">*</span></label>
        <input type="tel" name="contacto" class="form-control" placeholder="Ej: 3151234567" required>
      </div>
      <button type="submit" class="btn btn-secondary" style="width:100%">Registrar Acopio</button>
    </form>
  `;
}

async function submitCentroAcopio(e) {
  e.preventDefault();
  const form = e.target;
  const dataObj = Object.fromEntries(new FormData(form));
  dataObj.owner_token = ownerToken;

  const data = await enviarFormulario(form, '/api/centros-acopio', JSON.stringify(dataObj), {
    headers: { 'Content-Type': 'application/json' }
  });
  if (!data) return;

  showToast('Centro de acopio registrado.');
  closeFormModal();
  renderAlojamientos();
}

// Form HTML 4: Refugio Mascota
function getFormRefugioMascotaHTML() {
  return `
    <h2>🐶 Registrar Refugio de Animales</h2>
    <form onsubmit="submitRefugioMascota(event)">
      <input type="text" name="honeypot" class="honeypot-field" tabindex="-1">
      <div class="form-group">
        <label>Tipo de Mascota Aceptada <span class="req">*</span></label>
        <select name="tipo_mascota" class="form-control" required>
          <option value="Perros">Perros</option>
          <option value="Gatos">Gatos</option>
          <option value="Perros y gatos">Perros y gatos</option>
          <option value="Otros">Otros</option>
        </select>
      </div>
      <div class="form-group">
        <label>Ciudad <span class="req">*</span></label>
        <input type="text" name="ciudad" class="form-control" placeholder="Ej: Pereira" required>
      </div>
      <div class="form-group">
        <label>Sector <span class="req">*</span></label>
        <input type="text" name="sector" class="form-control" placeholder="Ej: Alborada" required>
      </div>
      <div class="form-group">
        <label>Dirección <span class="req">*</span></label>
        <input type="text" name="direccion" class="form-control" required>
      </div>
      <div class="form-group">
        <label>Contacto <span class="req">*</span></label>
        <input type="tel" name="contacto" class="form-control" required>
      </div>
      <button type="submit" class="btn btn-secondary" style="width:100%">Ofrecer Refugio</button>
    </form>
  `;
}

async function submitRefugioMascota(e) {
  e.preventDefault();
  const form = e.target;
  const dataObj = Object.fromEntries(new FormData(form));
  dataObj.owner_token = ownerToken;

  const data = await enviarFormulario(form, '/api/refugios-mascota', JSON.stringify(dataObj), {
    headers: { 'Content-Type': 'application/json' }
  });
  if (!data) return;

  showToast('Refugio registrado.');
  closeFormModal();
  renderMascotas();
}

// Form HTML 5: Necesidad Mascota
function getFormNecesidadMascotaHTML() {
  return `
    <h2>🐱 Necesito Refugio para mi Mascota</h2>
    <form onsubmit="submitNecesidadMascota(event)">
      <input type="text" name="honeypot" class="honeypot-field" tabindex="-1">
      <div class="form-group">
        <label>Nombre del Encargado <span class="req">*</span></label>
        <input type="text" name="nombre_encargado" class="form-control" required>
      </div>
      <div class="form-group">
        <label>Contacto / WhatsApp <span class="req">*</span></label>
        <input type="tel" name="contacto" class="form-control" required>
      </div>
      <div class="form-group">
        <label>Tipo de Mascota <span class="req">*</span></label>
        <select name="tipo_mascota" class="form-control" required>
          <option value="Perro">Perro</option>
          <option value="Gato">Gato</option>
          <option value="Perros y gatos">Perros y gatos</option>
          <option value="Otros">Otros</option>
        </select>
      </div>
      <div class="form-group">
        <label>¿Cuántas mascotas son? <span class="req">*</span></label>
        <select name="cantidad_mascotas" class="form-control" required>
          <option value="Una">Una</option>
          <option value="Dos">Dos</option>
          <option value="Tres o más">Tres o más</option>
        </select>
      </div>
      <button type="submit" class="btn btn-warning" style="width:100%">Solicitar Refugio</button>
    </form>
  `;
}

async function submitNecesidadMascota(e) {
  e.preventDefault();
  const form = e.target;
  const dataObj = Object.fromEntries(new FormData(form));
  dataObj.owner_token = ownerToken;

  const data = await enviarFormulario(form, '/api/necesidades-mascota', JSON.stringify(dataObj), {
    headers: { 'Content-Type': 'application/json' }
  });
  if (!data) return;

  showToast('Solicitud para mascota registrada.');
  closeFormModal();
  renderMascotas();
}

// ===== RENDERS DE VISTAS Y LISTAS =====

// Pestaña 2: Alojamientos
async function renderAlojamientos() {
  const ciudadSel = document.getElementById('filter-ciudad-alojamientos').value;

  // Render Centros de Acopio
  try {
    const res = await fetch('/api/centros-acopio');
    const centros = await res.json();
    const listAcopioEl = document.getElementById('list-centros-acopio');

    const filtered = (ciudadSel === 'TODAS') ? centros : centros.filter(c => c.ciudad.toLowerCase() === ciudadSel.toLowerCase());

    if (!filtered.length) {
      listAcopioEl.innerHTML = `<p class="empty-msg">No hay centros de acopio registrados en esta ciudad.</p>`;
    } else {
      listAcopioEl.innerHTML = filtered.map(c => `
        <div class="card">
          <div class="card-header">
            <h4 class="card-title">📦 ${c.sector} (${c.ciudad})</h4>
            <span class="card-time">${getRelativeTime(c.fecha_registro)}</span>
          </div>
          <div class="card-body">
            <p><strong>Dirección:</strong> ${c.direccion}</p>
            <p><strong>Contacto:</strong> ${c.contacto}</p>
          </div>
          <div class="card-actions">
            <a href="tel:${c.contacto.replace(/\D/g,'')}" class="btn btn-secondary btn-sm">📞 Llamar</a>
            <a href="https://wa.me/57${c.contacto.replace(/\D/g,'')}" target="_blank" class="btn btn-primary btn-sm">💬 WhatsApp</a>
            <button class="btn btn-outline btn-sm" onclick="reportar('centro_acopio', '${c.id}')">🚩 Reportar</button>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {}

function getPlaceholderImg(tipo) {
  const icons = {
    'Casa': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="160"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1E293B"/><stop offset="100%" stop-color="#0F172A"/></linearGradient></defs><rect width="400" height="200" fill="url(#g1)" rx="8"/><path d="M200 45 L280 110 L260 110 L260 160 L140 160 L140 110 L120 110 Z" fill="none" stroke="#38BDF8" stroke-width="6" stroke-linejoin="round"/><path d="M185 160 L185 125 L215 125 L215 160 Z" fill="#38BDF8"/><text x="200" y="185" font-family="sans-serif" font-size="13" font-weight="600" fill="#94A3B8" text-anchor="middle">Casa de Alojamiento</text></svg>`,
    'Apartamento': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="160"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1E293B"/><stop offset="100%" stop-color="#0F172A"/></linearGradient></defs><rect width="400" height="200" fill="url(#g2)" rx="8"/><rect x="150" y="40" width="100" height="120" rx="4" fill="none" stroke="#818CF8" stroke-width="5"/><rect x="170" y="60" width="20" height="20" fill="#818CF8" rx="2"/><rect x="210" y="60" width="20" height="20" fill="#818CF8" rx="2"/><rect x="170" y="95" width="20" height="20" fill="#818CF8" rx="2"/><rect x="210" y="95" width="20" height="20" fill="#818CF8" rx="2"/><rect x="188" y="130" width="24" height="30" fill="#818CF8"/><text x="200" y="185" font-family="sans-serif" font-size="13" font-weight="600" fill="#94A3B8" text-anchor="middle">Apartamento Disponible</text></svg>`,
    'Habitación': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="160"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1E293B"/><stop offset="100%" stop-color="#0F172A"/></linearGradient></defs><rect width="400" height="200" fill="url(#g3)" rx="8"/><path d="M130 140 L130 90 C130 80 140 70 150 70 L250 70 C260 70 270 80 270 90 L270 140 Z" fill="none" stroke="#F43F5E" stroke-width="5"/><rect x="145" y="85" width="45" height="25" fill="#F43F5E" rx="3"/><rect x="210" y="85" width="45" height="25" fill="#F43F5E" rx="3"/><rect x="130" y="115" width="140" height="25" fill="#F43F5E" rx="3"/><text x="200" y="185" font-family="sans-serif" font-size="13" font-weight="600" fill="#94A3B8" text-anchor="middle">Habitación Disponible</text></svg>`,
    'Bodega': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="160"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1E293B"/><stop offset="100%" stop-color="#0F172A"/></linearGradient></defs><rect width="400" height="200" fill="url(#g4)" rx="8"/><path d="M120 150 L120 80 L200 50 L280 80 L280 150 Z" fill="none" stroke="#10B981" stroke-width="5"/><rect x="170" y="100" width="60" height="50" fill="#10B981" rx="2"/><text x="200" y="185" font-family="sans-serif" font-size="13" font-weight="600" fill="#94A3B8" text-anchor="middle">Bodega / Espacio de Acopio</text></svg>`
  };
  const key = Object.keys(icons).find(k => (tipo || '').toLowerCase().includes(k.toLowerCase())) || 'Casa';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(icons[key]);
}

// Render Viviendas
  try {
    const res = await fetch('/api/viviendas');
    const viviendas = await res.json();
    const listViviendasEl = document.getElementById('list-viviendas');

    const filtered = (ciudadSel === 'TODAS') ? viviendas : viviendas.filter(v => v.ciudad.toLowerCase() === ciudadSel.toLowerCase());

    if (!filtered.length) {
      listViviendasEl.innerHTML = `<p class="empty-msg">No hay viviendas registradas en esta ciudad.</p>`;
    } else {
      listViviendasEl.innerHTML = filtered.map(v => {
        const placeholder = getPlaceholderImg(v.tipo);
        const imgSrc = v.foto_id ? `/api/viviendas/${v.id}/foto` : placeholder;
        return `
        <div class="card">
          <img src="${imgSrc}" class="card-img" alt="Foto de ${v.tipo}" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='${placeholder}';">
          <div class="card-header">
            <h4 class="card-title">🏠 ${v.tipo} en ${v.barrio} (${v.ciudad})</h4>
            <span class="badge ${v.estado === 'Busca ocupante' ? 'badge-ok' : 'badge-warning'}">${v.estado}</span>
          </div>
          <div class="card-body">
            <p><strong>Capacidad:</strong> ${v.capacidad}</p>
            <p><strong>Encargado:</strong> ${v.nombre_encargado}</p>
            <p><strong>Contacto:</strong> ${v.contacto}</p>
            ${v.detalles ? `<p><strong>Detalles:</strong> ${v.detalles}</p>` : ''}
          </div>
          <div class="card-actions">
            <a href="tel:${v.contacto.replace(/\D/g,'')}" class="btn btn-secondary btn-sm">📞 Llamar</a>
            <a href="https://wa.me/57${v.contacto.replace(/\D/g,'')}" target="_blank" class="btn btn-primary btn-sm">💬 WhatsApp</a>
            <button class="btn btn-outline btn-sm" onclick="toggleEstadoVivienda('${v.id}', '${v.estado}')">🔄 Cambiar Estado</button>
            <button class="btn btn-outline btn-sm" onclick="reportar('vivienda', '${v.id}')">🚩 Reportar</button>
          </div>
        </div>
      `;
      }).join('');
    }
  } catch (e) {}
}

// Pestaña 3: Necesidades
async function renderNecesidades() {
  const ciudadSel = document.getElementById('filter-ciudad-necesidades').value;
  try {
    const res = await fetch('/api/necesidades-vivienda');
    const necesidades = await res.json();
    const container = document.getElementById('list-necesidades-vivienda');

    const filtered = (ciudadSel === 'TODAS') ? necesidades : necesidades.filter(n => n.ciudad.toLowerCase() === ciudadSel.toLowerCase());

    if (!filtered.length) {
      container.innerHTML = `<p class="empty-msg">No hay solicitudes de vivienda registradas en esta ciudad.</p>`;
    } else {
      container.innerHTML = filtered.map(n => `
        <div class="card">
          <div class="card-header">
            <h4 class="card-title">🆘 Familia ${n.nombre_familia}</h4>
            <span class="badge ${n.estado === 'Buscando alojamiento' ? 'badge-danger' : 'badge-ok'}">${n.estado}</span>
          </div>
          <div class="card-body">
            <p><strong>Ciudad:</strong> ${n.ciudad} | <strong>Personas:</strong> ${n.cantidad_personas}</p>
            ${n.condicion_especial ? `<p class="badge badge-warning">⚠️ Condición Especial: ${n.descripcion_condicion}</p>` : ''}
            <p><strong>Necesidad:</strong> ${n.descripcion_vivienda_necesita}</p>
            <p><strong>Contacto:</strong> ${n.contacto}</p>
          </div>
          <div class="card-actions">
            <a href="tel:${n.contacto.replace(/\D/g,'')}" class="btn btn-secondary btn-sm">📞 Llamar</a>
            <a href="https://wa.me/57${n.contacto.replace(/\D/g,'')}" target="_blank" class="btn btn-primary btn-sm">💬 WhatsApp</a>
            <button class="btn btn-outline btn-sm" onclick="toggleEstadoNecesidad('${n.id}', '${n.estado}')">🔄 Cambiar Estado</button>
            <button class="btn btn-outline btn-sm" onclick="reportar('necesidad_vivienda', '${n.id}')">🚩 Reportar</button>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {}
}

// Pestaña 4: Mascotas
async function renderMascotas() {
  try {
    const resR = await fetch('/api/refugios-mascota');
    const refugios = await resR.json();
    document.getElementById('list-refugios-mascota').innerHTML = !refugios.length ? `<p class="empty-msg">No hay refugios registrados.</p>` : refugios.map(r => `
      <div class="card">
        <div class="card-header"><h4 class="card-title">🐶 Refugio en ${r.sector} (${r.ciudad})</h4></div>
        <div class="card-body">
          <p><strong>Acepta:</strong> ${r.tipo_mascota}</p>
          <p><strong>Dirección:</strong> ${r.direccion}</p>
          <p><strong>Contacto:</strong> ${r.contacto}</p>
        </div>
        <div class="card-actions">
          <a href="tel:${r.contacto.replace(/\D/g,'')}" class="btn btn-secondary btn-sm">📞 Llamar</a>
          <a href="https://wa.me/57${r.contacto.replace(/\D/g,'')}" target="_blank" class="btn btn-primary btn-sm">💬 WhatsApp</a>
          <button class="btn btn-outline btn-sm" onclick="reportar('refugio_mascota', '${r.id}')">🚩 Reportar</button>
        </div>
      </div>
    `).join('');

    const resN = await fetch('/api/necesidades-mascota');
    const necM = await resN.json();
    document.getElementById('list-necesidades-mascota').innerHTML = !necM.length ? `<p class="empty-msg">No hay mascotas registradas buscando refugio.</p>` : necM.map(m => `
      <div class="card">
        <div class="card-header"><h4 class="card-title">🐱 ${m.nombre_encargado}</h4></div>
        <div class="card-body">
          <p><strong>Mascota:</strong> ${m.tipo_mascota} (${m.cantidad_mascotas})</p>
          <p><strong>Contacto:</strong> ${m.contacto}</p>
        </div>
        <div class="card-actions">
          <a href="tel:${m.contacto.replace(/\D/g,'')}" class="btn btn-secondary btn-sm">📞 Llamar</a>
          <a href="https://wa.me/57${m.contacto.replace(/\D/g,'')}" target="_blank" class="btn btn-primary btn-sm">💬 WhatsApp</a>
          <button class="btn btn-outline btn-sm" onclick="reportar('necesidad_mascota', '${m.id}')">🚩 Reportar</button>
        </div>
      </div>
    `).join('');
  } catch (e) {}
}

// Acciones de Cambio de Estado
async function toggleEstadoVivienda(id, estadoActual) {
  const nuevoEstado = estadoActual === 'Busca ocupante' ? 'Ya fue ocupada' : 'Busca ocupante';
  try {
    const res = await fetch(`/api/viviendas/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado, owner_token: ownerToken })
    });
    if (res.ok) {
      showToast(`Estado actualizado a: ${nuevoEstado}`);
      renderAlojamientos();
      return;
    }
    // BUG-003: el servidor ahora responde 403 si no eres el autor. Sin este mensaje
    // el botón parecía roto (no pasaba nada al hacer clic).
    const data = await res.json().catch(() => ({}));
    showToast(data.error || 'No se pudo actualizar el estado.', 'error');
  } catch (e) {
    showToast('Sin conexión. Verifica tu internet e intenta de nuevo.', 'error');
  }
}

async function toggleEstadoNecesidad(id, estadoActual) {
  const nuevoEstado = estadoActual === 'Buscando alojamiento' ? 'Ya encontró alojamiento' : 'Buscando alojamiento';
  try {
    const res = await fetch(`/api/necesidades-vivienda/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado, owner_token: ownerToken })
    });
    if (res.ok) {
      showToast(`Estado actualizado a: ${nuevoEstado}`);
      renderNecesidades();
      return;
    }
    const data = await res.json().catch(() => ({}));
    showToast(data.error || 'No se pudo actualizar el estado.', 'error');
  } catch (e) {
    showToast('Sin conexión. Verifica tu internet e intenta de nuevo.', 'error');
  }
}

// Reporte Comunitario Anti-Spam
async function reportar(tipo, id) {
  if (!confirm('¿Deseas reportar este registro como información falsa o número fuera de servicio?')) return;
  try {
    const res = await fetch(`/api/reportar/${tipo}/${id}`, { method: 'POST' });
    const data = await res.json();
    showToast(data.message);
  } catch (e) {}
}

// ===== PANEL ADMIN SECRETO =====
function openAdminModal() {
  document.getElementById('modal-admin').classList.add('active');
  if (adminKey) {
    document.getElementById('admin-login-sec').style.display = 'none';
    document.getElementById('admin-dashboard-sec').style.display = 'block';
    fetchAdminData();
  }
}

function closeAdminModal() {
  document.getElementById('modal-admin').classList.remove('active');
}

async function loginAdmin() {
  const pass = document.getElementById('admin-pass-input').value;
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pass })
    });
    if (res.ok) {
      const data = await res.json();
      adminKey = data.key;
      localStorage.setItem('admin_key', adminKey);
      document.getElementById('admin-login-sec').style.display = 'none';
      document.getElementById('admin-dashboard-sec').style.display = 'block';
      fetchAdminData();
    } else {
      showToast('Clave de administración incorrecta', 'error');
    }
  } catch (e) {}
}

async function fetchAdminData() {
  try {
    const res = await fetch('/api/admin/registros', {
      headers: { 'x-admin-key': adminKey }
    });
    if (!res.ok) return;
    const data = await res.json();

    let html = `
      <h3>🏠 Viviendas</h3>
      <table class="admin-table">
        <tr><th>Tipo</th><th>Ciudad</th><th>Contacto</th><th>Estado</th><th>Sospechoso</th><th>Acción</th></tr>
        ${data.viviendas.map(v => `
          <tr>
            <td>${v.tipo}</td>
            <td>${v.ciudad}</td>
            <td>${v.contacto}</td>
            <td>${v.estado}</td>
            <td>${v.sospechoso ? '🚨 Sí' : 'No'}</td>
            <td>
              <button class="btn btn-danger btn-sm" onclick="adminEliminar('vivienda','${v.id}')">Eliminar</button>
              ${v.sospechoso ? `<button class="btn btn-primary btn-sm" onclick="adminAprobar('vivienda','${v.id}')">Aprobar</button>` : ''}
            </td>
          </tr>
        `).join('')}
      </table>

      <h3>🆘 Necesidades Vivienda</h3>
      <table class="admin-table">
        <tr><th>Familia</th><th>Ciudad</th><th>Contacto</th><th>Estado</th><th>Sospechoso</th><th>Acción</th></tr>
        ${data.necesidades.map(n => `
          <tr>
            <td>${n.nombre_familia}</td>
            <td>${n.ciudad}</td>
            <td>${n.contacto}</td>
            <td>${n.estado}</td>
            <td>${n.sospechoso ? '🚨 Sí' : 'No'}</td>
            <td>
              <button class="btn btn-danger btn-sm" onclick="adminEliminar('necesidad_vivienda','${n.id}')">Eliminar</button>
              ${n.sospechoso ? `<button class="btn btn-primary btn-sm" onclick="adminAprobar('necesidad_vivienda','${n.id}')">Aprobar</button>` : ''}
            </td>
          </tr>
        `).join('')}
      </table>
    `;

    document.getElementById('admin-content-list').innerHTML = html;
  } catch (e) {}
}

async function adminEliminar(tipo, id) {
  if (!confirm('¿Eliminar definitivamente este registro?')) return;
  try {
    const res = await fetch(`/api/admin/eliminar/${tipo}/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': adminKey }
    });
    if (res.ok) {
      showToast('Registro eliminado');
      fetchAdminData();
    }
  } catch (e) {}
}

async function adminAprobar(tipo, id) {
  try {
    const res = await fetch(`/api/admin/aprobar/${tipo}/${id}`, {
      method: 'PATCH',
      headers: { 'x-admin-key': adminKey }
    });
    if (res.ok) {
      showToast('Registro verificado y aprobado');
      fetchAdminData();
    }
  } catch (e) {}
}
