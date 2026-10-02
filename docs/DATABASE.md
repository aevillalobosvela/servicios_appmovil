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

### `public.app_tokens`
Tokens opacos (OAT) generados por AdonisJS para autenticar las peticiones tanto de la App Móvil como del Panel Admin. Garantizan el cierre de sesión seguro o la invalidación automática ante robo.

### `public.app_registro` (La más importante)
Guarda el estado real de emisión de la credencial del estudiante.

Columnas clave:

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | PK incremental | Semilla para generar QR y código OTP |
| `id_persona` | FK → `public.personas` | Propietario del carnet |
| `id_carrera` | FK → `public.carreras` | Carrera vinculada (una fila por carrera) |
| `estado` | string | `activo`, `inactivo` o `expirado` |
| `device_token` | text (SHA-256) | Hash del UUID del dispositivo autorizado |
| `activado_en` | timestamp | Fecha de primera activación |
| `expira_en` | timestamp | Vigencia (2 años desde activación) |

Índices de rendimiento (creados por la migración `1787400000005`):
- `idx_app_registro_persona_estado` — índice compuesto `(id_persona, estado)`: evita seq scan en el listado del panel admin.
- `idx_app_registro_id_persona` — índice simple para lookups directos sin filtro de estado.

### `public.app_push_tokens`
Tokens de la API de notificaciones Push de Expo, mapeados por persona, para segmentar avisos institucionales masivos por facultad o de forma global.

### `public.app_banners`
Contenido publicitario o informativo emitido por DTIC que se visualiza en la App, con control de fechas y activación (switch On/Off).

---

## 4. Detalle de Migraciones

Las migraciones se encuentran en `backend/database/migrations/` y se ejecutan en orden estricto por nombre de archivo. El comando es:

```bash
docker compose exec backend node ace migration:run --force
```

| Archivo | Tabla creada | Notas |
|---|---|---|
| `1787400000000_create_app_tokens_table.ts` | `public.app_tokens` | Tokens OAT para app móvil y panel admin |
| `1787400000001_create_app_registro_table.ts` | `public.app_registro` | Tabla central del carnet digital |
| `1787400000002_create_app_push_tokens_table.ts` | `public.app_push_tokens` | Tokens push de Expo |
| `1787400000003_create_app_banners_table.ts` | `public.app_banners` | Banners informativos |
| `1787400000005_add_performance_indexes_app_registro.ts` | — | Crea índices de rendimiento sobre `app_registro` |

> **Nota sobre la migración `1787400000005`:** Utiliza `CREATE INDEX CONCURRENTLY`, una sentencia de PostgreSQL que **no puede ejecutarse dentro de una transacción**. Esta migración tiene declarado `static disableTransactions = true`, que es el mecanismo oficial de AdonisJS para ejecutarla fuera de transacción. No se debe eliminar esa propiedad.

> **Nota sobre el número de archivo `1787400000004`:** No existe una migración con ese número. El salto del `003` al `005` es intencional y no afecta el funcionamiento — AdonisJS ordena las migraciones por nombre de archivo de forma natural.
