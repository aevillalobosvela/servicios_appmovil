# ── Etapa 1: Compilación (Build Stage) ──
FROM node:24-alpine AS builder

WORKDIR /app

# Instalar herramientas de compilación para dependencias nativas (como better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copiar archivos de definición de paquetes
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies para compilar)
RUN npm ci

# Copiar el código fuente completo del backend
COPY . .

# Compilar la aplicación AdonisJS a JavaScript puro
RUN node ace build

# Eliminar dependencias de desarrollo para dejar solo las de producción
RUN npm prune --omit=dev

# ── Etapa 2: Servidor en Producción (Runtime Stage) ──
FROM node:24-alpine AS runner

WORKDIR /app

# Establecer variables de entorno por defecto para producción
ENV NODE_ENV=production
ENV PORT=3333
ENV HOST=0.0.0.0

# Copiar el build compilado y dependencias con propiedad del usuario node
COPY --from=builder --chown=node:node /app/build ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

# Crear directorios temporales y públicos para AdonisJS y asignar permisos
RUN mkdir -p /app/tmp /app/public/uploads/banners && chown -R node:node /app/tmp /app/public

# Cambiar al usuario no privilegiado node
USER node

# Exponer el puerto del servidor
EXPOSE 3333

# Comando para arrancar el servidor
CMD ["node", "bin/server.js"]
