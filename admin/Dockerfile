# ── Etapa 1: Compilación (Build Stage) ──
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de definición de dependencias
COPY package*.json ./

# Instalar todas las dependencias
RUN npm ci

# Copiar el código fuente completo de la aplicación web
COPY . .

# Inyectar URL de la API de producción en tiempo de construcción para Vite
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Compilar el panel de administración
RUN npm run build

# ── Etapa 2: Servidor Web de Producción (Runtime Stage) ──
FROM nginx:1.25-alpine AS runner

# Copiar los recursos compilados estáticos al directorio de hosting de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto HTTP estándar
EXPOSE 80

# Iniciar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
