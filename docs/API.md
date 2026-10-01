# Referencia de la API (Servicios Digitales UTO)

La API REST está escrita en AdonisJS y se expone a través del prefijo global `/api/v1`.

## 1. Endpoints Públicos (Dispositivos validadores y App anónima)

- `POST /consulta/verificar`
  **Descripción:** Endpoint consumido por los lectores de control (ej. Comedor, Transporte). Recibe un Código Alfanumérico o un Token QR, valida su firma o base de datos, y retorna la identidad de la persona si es válido, indicando que tiene el carnet habilitado. Rate-limited.

- `POST /notifications/register-token`
  **Descripción:** La App Móvil al iniciar inscribe su Token Push (Expo) asociado a la persona (si la sesión está iniciada) o anónimo.

- `GET /banners/active`
  **Descripción:** Retorna el banner activo de mayor prioridad que no haya expirado para ser visualizado en la pantalla principal de la app.

- `POST /app/activar`
  **Descripción:** Endpoint consumido post-login en Ciudadanía Digital. El frontend móvil envía el JWT de AGETIC, el backend lo valida, y si cumple con requisitos académicos/financieros (o quema un valor), registra el `device_token` del móvil y retorna el Bearer Token propio del sistema.

## 2. Endpoints Privados (App Móvil del Estudiante)

Estos endpoints requieren el header `Authorization: Bearer <Token>` y pasan por el middleware `auth:estudiante`.

- `POST /app/logout`
  **Descripción:** Destruye el token de sesión en la base de datos y desvincula el dispositivo.
  
- `GET /app/carnet`
  **Descripción:** Retorna todos los datos formales de la persona y de la credencial digital (nombres, foto, C.I., carrera, estado de la credencial, fechas de emisión y caducidad).

- `GET /app/carnet/qr`
  **Descripción:** Retorna un Token QR (formato imagen Base64 y cadena firmada) autogenerado criptográficamente (HMAC-SHA256) válido por 1 hora para control offline en transporte/comedor.

- `GET /app/carnet/codigo`
  **Descripción:** Retorna un código alfanumérico aleatorio de 5 dígitos (ej. `A7B4K`) válido por 10 minutos para control offline visual/vocal.

## 3. Endpoints Privados (Panel de Administración)

Estos endpoints requieren el header `Authorization: Bearer <Token>` emitido a los administradores y pasan por el middleware `auth:admin`. Todas estas llamadas tienen el prefijo `/api/v1/admin/`.

- `POST /auth/logout`
  **Descripción:** Cierra la sesión del operador/administrador.

- `GET /auth/me`
  **Descripción:** Retorna la información básica del administrador actualmente logueado.

### Módulo de Carnets
- `GET /carnets`
  **Descripción:** Listado y buscador general super rápido de personas en el sistema. Filtra por estado (activo, expirado, inactivo) y puede buscar por C.I. o nombres. Paginado.
- `GET /carnets/:id`
  **Descripción:** Retorna el detalle académico exhaustivo (carreras paralelas, pagos, etc.) de un estudiante determinado.
- `POST /carnets/:id/desactivar`
  **Descripción:** **Kill-Switch**. Invalida remotamente una credencial activa (ej. ante denuncia de robo de celular por parte del estudiante en las oficinas).

### Módulo de Notificaciones Push
- `GET /notifications/stats`
  **Descripción:** Estadísticas generales de los tokens Push registrados en el sistema.
- `POST /notifications/send`
  **Descripción:** Dispara una notificación Push asíncrona hacia los teléfonos móviles, segmentada opcionalmente por facultad o enviada masivamente a todos.

### Módulo de Banners
- `GET /banners` (Listar todos, inactivos y activos).
- `POST /banners` (Cargar un nuevo banner con imagen multipart/form-data).
- `PUT /banners/:id/toggle` (Encender/Apagar un banner).
- `DELETE /banners/:id` (Eliminar lógicamente un banner).

### Módulo de Operadores
- `GET /operators` (Listar todos los operadores y administradores del sistema).
- `GET /personas/search?dip=...` (Busca una persona en el sistema universitario para ser promovida a operador).
- `GET /facultades` (Lista las facultades para asignación restrictiva a operadores de notificaciones).
- `POST /operators` (Crea un usuario administrador).
- `PUT /operators/:id/toggle` (Inhabilita o rehabilita el acceso de un administrador al panel).
