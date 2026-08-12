#!/bin/sh
set -e

echo "===== Alojamiento Terremoto Colombia — Entrypoint ====="

# 1. Cargar variables de entorno desde .env si existe (desarrollo)
if [ -f ".env" ]; then
  echo "📁 Cargando variables desde .env..."
  export $(grep -v '^#' .env | xargs)
fi

# 2. Establecer valores por defecto si no vienen de las variables de entorno
# BUG-002: ADMIN_PASSWORD ya NO tiene valor por defecto aquí. La validación vive en
# server/index.js, que rechaza claves débiles o ausentes cuando NODE_ENV=production.
export PORT="${PORT:-3000}"
export NODE_ENV="${NODE_ENV:-production}"

echo "🌐 Puerto: $PORT"
echo "⚙️  Entorno: $NODE_ENV"
echo "🗄️  DATABASE_URL: ${DATABASE_URL:-SQLite local (data.db)}"
echo "🔐 ADMIN_PASSWORD: ${ADMIN_PASSWORD:+definida}${ADMIN_PASSWORD:-NO DEFINIDA}"

# 3. Instalar dependencias si no existen (por si el volumen no las tiene)
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
  echo "📦 Instalando dependencias npm..."
  npm ci --only=production
else
  echo "✅ Dependencias npm ya instaladas."
fi

# 4. Iniciar el servidor
echo "🚀 Iniciando servidor en el puerto $PORT..."
exec node server/index.js
