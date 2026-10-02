# Referencia de la API (Servicios Digitales UTO)

La API REST está escrita en AdonisJS y se expone a través del prefijo global `/api/v1`.

Todos los endpoints de la App Móvil usan autenticación **Bearer Token** (OAT de 2 años).  
Todos los endpoints del Panel Admin usan **Bearer Token** (OAT de 8 horas).

---

## 1. Endpoints Públicos (Sin autenticación)

Accesibles desde cualquier cliente. Todos pasan por el middleware de rate limiting (30 req/min por IP).

### Autenticación del Panel Admin
- **`POST /admin/auth`**  
  Login del operador o administrador del panel web. Recibe `{ usuario, password }` y devuelve el Bearer Token de sesión (8 horas) junto a los datos del usuario y su rol (`ADMINISTRADOR_APP` o `OPERADOR_NOTIFICACIONES`).

### App Móvil — Activación
- **`POST /app/activar`**  
  Endpoint consumido tras el login en Ciudadanía Digital (AGETIC). Recibe `{ authCode, codeVerifier, deviceToken }`. El backend intercambia el código OAuth2 con AGETIC, obtiene el C.I. del ciudadano, valida su situación académica y financiera, y si todo es correcto activa el carnet registrando el `device_token` del dispositivo. Devuelve el Bearer Token propio del sistema (2 años).

### App Móvil — Registro de token push
- **`POST /notifications/register-token`**  
  La app inscribe su token de notificaciones push (Expo) al iniciar, asociado a la persona autenticada o de forma anónima.

### App Móvil — Banners
- **`GET /banners/active`**  
  Retorna el banner activo más reciente para mostrarse en la pantalla principal de la app. Devuelve `null` si no hay ninguno activo.

### Dispositivos validadores — Verificación de carnet
- **`POST /consulta/verificar`**  
  Consumido por lectores de control (comedor, transporte). Recibe un token QR o código alfanumérico, valida su firma criptográfica, y retorna la identidad del portador si es válido.

---

## 2. Endpoints Privados — App Móvil del Estudiante

Requieren `Authorization: Bearer <token_estudiante>`. Pasan por el middleware `student` que verifica que el carnet esté en estado `activo` y no haya expirado.

- **`POST /app/logout`**  
  Destruye el token de sesión en la BD. El carnet permanece `activo` en la tabla para permitir recuperación de sesión sin costo en el mismo dispositivo.

- **`GET /app/carnet`**  
  Retorna todos los datos del carnet: nombre completo, C.I., código de estudiante, carrera, facultad, tipo de estudiante, URL de foto, período académico, estado y fechas de vigencia.

- **`GET /app/carnet/qr`**  
  Genera y retorna un QR dinámico (imagen Base64) firmado con HMAC-SHA256 usando el `APP_KEY`. Válido por aproximadamente 1 hora (ventana horaria). Se regenera automáticamente en la app cada 9 minutos.

- **`GET /app/carnet/codigo`**  
  Genera y retorna un código alfanumérico de 5 dígitos válido por 10 minutos. Se almacena en `app_registro.codigo_verificacion` con su timestamp de expiración. Útil para validación oral o manual sin necesidad de escanear QR.

---

## 3. Endpoints Privados — Panel de Administración

Requieren `Authorization: Bearer <token_admin>`. Pasan por el middleware `admin` que verifica que la cuenta esté activa. Todas las rutas tienen el prefijo `/api/v1/admin/`.

### Sesión
- **`POST /auth/logout`** — Cierra la sesión del operador/administrador (destruye el token en BD).
- **`GET /auth/me`** — Retorna los datos básicos del administrador autenticado (`id`, `usuario`, `nombre`).

### Módulo de Carnets
- **`GET /carnets`**  
  Listado paginado de personas con carnets. Parámetros opcionales: `?estado=activo|expirado|inactivo`, `?search=<nombre o CI>`, `?page=<n>`, `?limit=<n>` (por defecto 10). Por defecto muestra solo carnets activos. Incluye por persona: total de carreras, carreras activas, carreras con matrícula habilitada y disponibilidad de pago de reposición (trámite 868).

- **`GET /carnets/:id`**  
  Detalle exhaustivo de un estudiante por `id_persona` o C.I. Devuelve datos personales, array de todas sus carreras con estado académico y de carnet, historial de deudas, y flags de `esPrimeraEmision` y `tienePagoValor`.

- **`POST /carnets/:id/desactivar`**  
  **Kill-Switch.** Invalida remotamente el carnet (`id` = PK de `app_registro`). Limpia `device_token`, `activado_en`, `expira_en` y pone `estado = 'inactivo'`. La próxima llamada autenticada del estudiante recibirá un `403` y la app cerrará la sesión automáticamente.

### Módulo de Notificaciones Push
- **`GET /notifications/stats`** — Estadísticas de tokens push registrados (total, por OS, por perfil).
- **`POST /notifications/send`** — Envía notificación push asíncrona. Cuerpo: `{ titulo, cuerpo, idFacultad? }`. Si `idFacultad` es nulo, se envía a todos los dispositivos registrados.

### Módulo de Banners
- **`GET /banners`** — Lista todos los banners (activos e inactivos) ordenados del más reciente al más antiguo.
- **`POST /banners`** — Sube un nuevo banner (`multipart/form-data`: `imagen`, `titulo?`, `enlaceRedireccion?`, `activo`). Si `activo=true`, desactiva automáticamente todos los demás.
- **`PUT /banners/:id/toggle`** — Activa o desactiva un banner (`{ activo: boolean }`). Activar uno desactiva todos los demás.
- **`DELETE /banners/:id`** — Elimina el banner y su archivo de imagen del servidor.

### Módulo de Operadores
- **`GET /operators`** — Lista todos los operadores y administradores del sistema con su rol y restricción de facultad.
- **`GET /personas/search?dip=<CI>`** — Busca una persona en el catálogo universitario para ser promovida a operador.
- **`GET /facultades`** — Lista las facultades disponibles para asignación restrictiva a operadores de notificaciones.
- **`POST /operators`** — Crea o reactiva un operador. Cuerpo: `{ idPersona, rol, idFacultad?, password? }`. Roles válidos: `ADMINISTRADOR_APP`, `OPERADOR_NOTIFICACIONES`. Si el usuario ya existe en `_usuarios`, actualiza su `clave2` si se proporciona contraseña.
- **`PUT /operators/:id/toggle`** — Habilita o deshabilita el acceso de un operador (`{ activo: boolean }`). Opera sobre `id_usr_rol` en `_usr_roles`.
