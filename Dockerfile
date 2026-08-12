# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production Stage
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# Copiar dependencias del build stage
COPY --from=builder /app/node_modules ./node_modules

# Copiar código fuente
COPY . .

# Hacer ejecutable el entrypoint
RUN chmod +x entrypoint.sh

EXPOSE 3000

# Healthcheck cada 30s para que Docker sepa si el contenedor está sano
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Ejecutar el entrypoint (seeder automático)
ENTRYPOINT ["./entrypoint.sh"]
