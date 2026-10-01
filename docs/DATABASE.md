# Base de Datos y Modelado de Datos

El backend se conecta a una base de datos PostgreSQL institucional unificada (ej. `miuto_des`). El diseño de la solución debe respetar una filosofía estricta: **no modificar ni alterar la estructura de las tablas institucionales críticas (solo lectura).**

## 1. Esquema de Solo Lectura (Consultas Cruzadas)

Para determinar el estado de un estudiante, el sistema realiza cruces de datos (JOINs y subconsultas) altamente optimizados a través de las siguientes tablas, las cuales no administra:

- **`public.personas`**: Datos personales básicos (C.I., nombres, fechas de nacimiento, foto digital alojada en el servidor SAGA).
- **`public.estudiantes`**: Registro académico del estudiante en carreras específicas, contiene su ID académico y el estado del pago por ser estudiante activo.
- **`public.facultades` y `public.carreras`**: Catálogos.
- **`matricula.pagos`**: Registros transaccionales anuales del pago del derecho a matrícula del estudiante por gestión.
- **`tesoro.rcobros` y `tesoro.rtramites`**: Tablas donde se buscan recibos de cobro universitarios. El sistema escanea pagos no utilizados del trámite **868** (reposición de carnet universitario).
- **`public.deudores` y `public.deudores_responsables`**: Verificación de deudas pendientes en bibliotecas u otros entes que impiden la matriculación limpia.

## 2. Esquema Mixto (Lectura/Escritura Legada)

Existen tablas propias del ecosistema administrativo de la universidad en las que este sistema sí escribe, pero bajo estrictas reglas para coexistir con otras aplicaciones:

- **`public._usuarios`**: Tabla de cuentas de usuario. Este backend la utiliza para autenticar a los operadores del Panel Admin. Si no existen, el sistema las crea en base a la persona (usando hashing seguro en la columna nueva `clave2`).
- **`public.sistemas`**: Catálogo de sistemas. El seeder inscribe automáticamente el sistema actual usando el valor `SYSTEM_ID` de las variables de entorno.
- **`public._roles`, `public._usr_roles`, `public._usr_facultades`**: Sistema de roles y accesos institucionales clásico, adaptado por nuestro seeder para crear `ADMINISTRADOR_APP` y `OPERADOR_NOTIFICACIONES`.
- **`public.emisiones_certificacion`**: Tabla crítica donde el backend registra o "quema" un recibo de cobro `868` cuando un estudiante activa su carnet de reposición. Esto evita el doble gasto de un mismo valor.

## 3. Esquema Propio (App Móvil)

Estas son las tablas exclusivas del sistema de Carnet Digital, creadas y gestionadas íntegramente por nuestras Migraciones de AdonisJS:

### `public.app_registro` (La más importante)
Guarda el estado real de emisión de la credencial del estudiante.
- Columnas Clave: `id_persona`, `estado` ('activo', 'inactivo', 'expirado'), `device_token` (identificador único del celular autorizado), `activado_en`, `expira_en`.
- Rendimiento: Cuenta con los índices compuestos concurrentes `idx_app_registro_persona_estado` y `idx_app_registro_id_persona` que permiten listados ultra veloces en el Panel de Administración sin importar el volumen masivo de estudiantes.

### `public.app_tokens`
Tokens JWT opacos generados por AdonisJS para autenticar las peticiones de la App Móvil. Garantizan el cierre de sesión seguro o la invalidación automática en caso de robo.

### `public.app_push_tokens`
Tokens de la API de notificaciones Push de Expo, mapeados por `id_persona`, para poder segmentar avisos institucionales masivos.

### `public.app_banners`
Contenido publicitario o informativo emitido por DTIC que se visualiza en la App, con control de fechas y activación (switch On/Off).
