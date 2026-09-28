# UTO — Panel de Administración (Web)

Este es el panel administrativo web del sistema de **Carnet Digital de la Universidad Técnica de Oruro (UTO)**. Está desarrollado utilizando **React**, **TypeScript**, **Vite** y componentes de iconografía **Lucide React**. Permite a la DTIC y personal autorizado auditar, activar, suspender y verificar credenciales de estudiantes.

---

## 🚀 Entorno de Desarrollo (Dev Setup)

### 📋 Requisitos Previos
Asegúrate de tener instalado:
- **Node.js** >= 18.x
- **NPM** >= 9.x

### 🛠️ Configuración e Instalación

1. **Instalar Dependencias:**
   Navega al directorio `admin/` y ejecuta:
   ```bash
   npm install
   ```

2. **Configurar el Archivo de Entorno:**
   Asegúrate de configurar el archivo `.env` en la raíz de la carpeta `admin/`. Este archivo indica a qué dirección de API se conectará el panel administrativo.
   ```env
   VITE_API_URL=http://localhost:3333/api/v1
   ```

3. **Iniciar el Servidor de Desarrollo:**
   Ejecuta el servidor de desarrollo local de Vite:
   ```bash
   npm run dev
   ```
   Por defecto, la interfaz estará disponible en: `http://localhost:5173`

---

## 📦 Compilación y Despliegue a Producción

Dado que esta aplicación es una Single Page Application (SPA), el comando de compilación generará únicamente archivos estáticos de HTML, CSS y JS, listos para ser servidos por cualquier servidor web.

### 1. Preparar Entorno de Producción
Modifica tu archivo `.env` o añade las variables correspondientes para que apunte al dominio del backend de producción:
```env
VITE_API_URL=https://tu-api.uto.edu.bo/api/v1
```

### 2. Compilar el Proyecto (Build)
Ejecuta la compilación de producción:
```bash
npm run build
```
Esto realizará la validación de tipos de TypeScript y generará el directorio **`dist/`** en la raíz del proyecto. Este directorio contiene los archivos optimizados y minificados para producción.

### 3. Alojamiento Estático (Hosting)
Sube todo el contenido de la carpeta `dist/` a tu servidor de hosting o servidor web (Nginx, Apache, IIS, Netlify, Vercel, etc.).

### ⚠️ Configuración Crítica del Servidor Web (Nginx / Router SPA)
Dado que se utiliza **React Router** para las rutas internas del panel (ej. `/carnets`, `/auditoria`), debes configurar tu servidor web para que cualquier ruta que no sea un archivo físico retorne el archivo `index.html` (para evitar errores 404 al refrescar las subpáginas).

#### Ejemplo de Configuración para Nginx:
```nginx
server {
    listen 80;
    server_name carnet.uto.edu.bo;

    root /var/www/uto-admin/dist;
    index index.html;

    location / {
        # Intenta servir la ruta como archivo, luego como directorio
        # y si no existe, redirige todo al index.html de la SPA
        try_files $uri $uri/ /index.html;
    }
}
```
