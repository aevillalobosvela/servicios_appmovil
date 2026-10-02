# Servicios Digitales UTO — Panel Admin & Backend

## Vision general del sistema

El sistema de Servicios Digitales UTO es una plataforma integral que busca facilitar diversos trámites y servicios a los estudiantes de la Universidad Técnica de Oruro (UTO). El sistema se compone de dos aplicaciones principales:

1. **Panel Admin:** Una interfaz administrativa web desarrollada con React y Vite, destinada a la gestión de operadores, publicación de banners informativos y, principalmente, como gestor centralizado para consultar y desactivar remotamente los carnets digitales emitidos.
2. **Backend:** Un servidor API REST desarrollado con AdonisJS y PostgreSQL, que sirve como núcleo lógico del sistema, manejando la lógica de negocio y la persistencia de datos.

El sistema completo se ejecuta dentro de contenedores Docker, orquestados mediante un archivo `docker-compose.yml` en la raíz del proyecto. Esta orquestación se encarga de:
- Construir y ejecutar el contenedor del backend.
- Construir y ejecutar el contenedor del frontend.
- Crear una red virtual para la comunicación entre los servicios.
- Gestionar volúmenes para la persistencia de datos del backend y las imágenes del frontend.

La arquitectura se detalla en el archivo `docs/ARCHITECTURE.md`.

## Puntos Críticos de Atención en Producción

### 1. Permisos en el Volumen de Banners
El sistema almacena imagenes subidas por el administrador por tanto existe un directorio `public/uploads` donde se guardan las imagenes. Docker utiliza un volumen nombrado (`banner-uploads`) montado en `/app/public/uploads` para persistir los banners. Asegúrese de que el motor de Docker de la máquina host tenga permisos de lectura/escritura correctos para la carpeta interna de volúmenes de Docker.

### 2. Base de Datos
La base de datos se probó en el entorno de desarrollo `192.168.10.26` con la BD `miuto_des20260817`. Este sistema hace uso de las siguientes tablas **preexistentes** (no las crea ni las altera):

Solo lectura:
- `public.personas`
- `public.facultades`
- `public.estudiantes`
- `matricula.pagos`
- `tesoro.rcobros`
- `tesoro.rtramites`
- `public.deudores`
- `public.deudores_responsables`

Lectura y escritura (requieren permisos SELECT, INSERT, UPDATE):
- `public._usuarios` — cuentas de administradores y operadores
- `public.sistemas` — registro del sistema de servicios móviles (id_sistema = 7)
- `public._roles` — roles de seguridad
- `public._usr_roles` — asignación de roles a usuarios
- `public._usr_facultades` — restricciones de facultad para operadores
- `public.emisiones_certificacion` — registro de vouchers utilizados para activar carnets

Las tablas **creadas por el sistema** mediante migraciones son las siguientes (ver docs/DATABASE.md para el detalle):
- `public.app_tokens` (tablas de tokens de acceso)
- `public.app_registro` (tablas de registro de carnet digital)
- `public.app_push_tokens` (tablas de tokens de notificaciones push)
- `public.app_banners` (tablas de banners)

### 3. Variable de entorno identificador del Sistema (`SYSTEM_ID`)

La variable `SYSTEM_ID` en el `.env` define el identificador numérico único de esta aplicación dentro de las tablas globales `public.sistemas` y `public._roles`.
*   **Evitar colisiones**: Si el ID `7` (por defecto) ya está ocupado por otro sistema de la universidad, el encargado del despliegue puede asignar un nuevo ID libre (ej. `SYSTEM_ID=12`) en el archivo `.env`.
*   **Ajuste automático**: El seeder, el login de operadores y la validación de notificaciones push leerán este valor dinámicamente, evitando choques y sin requerir cambios de código ni recompilaciones.

### 4. Detalle de migraciones y seeders

Las migraciones y seeders se encuentran en la carpeta `database/` dentro del backend. Las migraciones crean las tablas propias del sistema y los seeders aprovisionan los datos iniciales mínimos necesarios para que el sistema funcione.

Las migraciones a ejecutar (en orden) son:
- `1787400000000_create_app_tokens_table.ts` — crea `public.app_tokens`
- `1787400000001_create_app_registro_table.ts` — crea `public.app_registro`
- `1787400000002_create_app_push_tokens_table.ts` — crea `public.app_push_tokens`
- `1787400000003_create_app_banners_table.ts` — crea `public.app_banners`
- `1787400000005_add_performance_indexes_app_registro.ts` — crea índices concurrentes (`idx_app_registro_persona_estado`, `idx_app_registro_id_persona`) optimizando radicalmente el tiempo de respuesta.

El seeder único (`database/seeders/usuario_seeder.ts`) es **idempotente** (puede ejecutarse múltiples veces sin duplicar datos) y se encarga de:

1. Registrar el sistema de servicios móviles en `public.sistemas` con el ID definido en `SYSTEM_ID` (por defecto: `7`).
2. Crear el rol `ADMINISTRADOR_APP` en `public._roles` para el sistema configurado.
3. Crear el rol `OPERADOR_NOTIFICACIONES` en `public._roles` para el sistema configurado.
4. Crear el usuario administrador inicial en `public._usuarios`, vinculado a la persona con C.I. `7419416`. Las credenciales se leen de las variables de entorno `INITIAL_ADMIN_USER` y `INITIAL_ADMIN_PASSWORD` (por defecto: `admin.dtic` / `admin123`).
5. Asignar el rol `ADMINISTRADOR_APP` al usuario administrador creado en `public._usr_roles`.

### 5. Dominios y DNS sugeridos para el despliegue de los sistemas

| Servicio | Dominio sugerido | Puerto interno del contenedor |
|---|---|---|
| Panel Admin (Nginx) | `servicios.uto.edu.bo` | `80` (configurable con `ADMIN_PORT`) |
| Backend API (AdonisJS) | `api-servicios.uto.edu.bo` | `3333` (configurable con `BACKEND_PORT`) |

Los dominios deben coincidir exactamente con las variables del `.env`:
- `CORS_ORIGIN=https://servicios.uto.edu.bo` (dominio del admin, para que el backend lo autorice)
- `VITE_API_URL=https://api-servicios.uto.edu.bo/api/v1` (URL completa del backend para el frontend)

### 6. Notificaciones Push (API de Expo)

El sistema utiliza la API de **Expo Push Notifications** para el envío de alertas y notificaciones a los dispositivos móviles.
*   **Sin dependencias de Firebase en el servidor**: El backend no requiere archivos de credenciales de Google Firebase (`google-services.json` o llaves de cuenta de servicio) ni configuración de certificados en el servidor.
*   **Requisito de red**: El contenedor del backend (`uto-backend`) requiere salida a internet (HTTPS, puerto 443) para conectarse al servicio externo de Expo en `https://exp.host`.

### 7. Resumen de Pasos y comandos rápidos para despliegue

**Paso 0 (Previo, una única vez) — Generar el `APP_KEY`**

Esta clave es el secreto maestro de cifrado del backend. Debe generarse localmente **una única vez** antes del primer despliegue y guardarse en el `.env` de producción. Si se regenera entre despliegues, todas las sesiones activas quedarán invalidadas.

```bash
# Desde la carpeta backend/, con las dependencias instaladas (npm install)
cd backend
node ace generate:key
```
El comando imprime una clave lista para usar, por ejemplo: `oX9Kd2...`. Copiarla al `.env` como valor de `APP_KEY`.

**Paso 1 — Configurar el archivo `.env`**

Copiar la plantilla e ingresar los valores reales de producción:
```bash
cp .env.example .env
```
Variables requeridas en el `.env`:
```env
APP_KEY=<generada con node ace generate:key>
APP_URL=https://api-servicios.uto.edu.bo
DB_HOSTNAME=<IP o hostname del servidor PostgreSQL>
DB_PORT=<puerto de PostgreSQL, por defecto 5432>
DB_DATABASE=<nombre de la BD>
DB_USERNAME=<usuario de BD>
DB_PASSWORD=<contraseña de BD>
CORS_ORIGIN=https://servicios.uto.edu.bo
VITE_API_URL=https://api-servicios.uto.edu.bo/api/v1

# Opcionales para el usuario administrador inicial (Seeder) y configuración de ID del sistema
INITIAL_ADMIN_USER=admin.dtic
INITIAL_ADMIN_PASSWORD=admin123
SYSTEM_ID=7
```
> ⚠️ `VITE_API_URL` se inyecta en tiempo de compilación del contenedor `admin` y `APP_URL` es requerida por el backend para validar URLs internas. Ambas deben estar definidas **antes** de ejecutar el siguiente paso.

**Paso 2 — Construir y levantar los contenedores**
```bash
docker compose up -d --build
```
Esto compila el backend (AdonisJS → `build/`) y el frontend (React → bundle estático servido por Nginx), y levanta ambos servicios. El servicio `admin` espera automáticamente a que `backend` esté saludable antes de iniciar.

**Paso 3 — Ejecutar las migraciones** (dentro del contenedor `backend` ya activo)
```bash
docker compose exec backend node ace migration:run --force
```
Crea las 4 tablas del sistema (`app_tokens`, `app_registro`, `app_push_tokens`, `app_banners`) e inyecta los **índices de rendimiento** para búsquedas rápidas. El flag `--force` es requerido por AdonisJS en modo producción.

**Paso 4 — Ejecutar el seeder inicial**
```bash
docker compose exec backend node ace db:seed
```
Registra el sistema, crea los roles y el usuario administrador inicial. Credenciales por defecto (si no se configuran `INITIAL_ADMIN_USER`/`INITIAL_ADMIN_PASSWORD` en el `.env`):
- **Usuario:** `admin.dtic`
- **Contraseña:** `admin123`

### 8. Verificación Post-Despliegue

Una vez completados los 4 pasos anteriores, ejecutar estas comprobaciones para confirmar que todo está operativo antes de entregar el sistema.

**Verificar que los contenedores están corriendo y saludables:**
```bash
docker compose ps
```
El estado de ambos servicios (`uto-backend` y `uto-admin`) debe ser `running (healthy)`.

**Verificar que el backend responde:**
```bash
curl -s http://localhost:3333/api/v1 | head -c 100
# Respuesta esperada: {"hello":"world"}
```

**Verificar que el panel admin carga:**
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:80
# Respuesta esperada: 200
```

**Verificar la conexión a la base de datos (desde dentro del contenedor):**
```bash
docker compose exec backend node ace migration:status
```
Todas las migraciones deben aparecer con estado `completed`. Si alguna aparece como `pending`, ejecutar el Paso 3 nuevamente.

**Verificar el login del administrador inicial:**
```bash
curl -s -X POST http://localhost:3333/api/v1/admin/auth \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin.dtic","password":"admin123"}'
```
La respuesta debe incluir un campo `token`. Si devuelve `403`, revisar que el seeder del Paso 4 se ejecutó correctamente.

**Verificar los logs en caso de error:**
```bash
# Logs del backend en tiempo real
docker compose logs -f backend

# Últimas 50 líneas del backend
docker compose logs --tail=50 backend

# Logs del panel admin (Nginx)
docker compose logs --tail=20 admin
```
