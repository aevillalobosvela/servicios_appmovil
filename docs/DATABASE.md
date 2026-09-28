# Base de Datos — Servicios Digitales UTO

Documentación del esquema de base de datos de los servicios móviles. Las únicas tablas creadas o modificadas por este sistema son aquellas del esquema `public` detalladas a continuación. El resto de las tablas académicas y de cobros ya existen de forma nativa en la base de datos de producción de la universidad.

Los grupos de tablas son:
1. **Tablas propias del sistema (Esquema `public`)** — tablas de control de acceso, banners, tokens y notificaciones (`app_registro`, `app_tokens`, `push_tokens`, `banners` y la integración con `_usuarios`).
2. **Tablas externas preexistentes (solo lectura)** — `public.personas`, `matricula.pagos` (y tablas auxiliares `carreras`, `gestiones`), `public.deudores` y `public.deudores_responsables`.
3. **Tabla externa de registro (lectura/escritura)** — `public.emisiones_certificacion` (donde se queman los cobros arancelarios utilizados).

---

## Tablas Propias (Esquema `public`)

Las tablas del sistema se crean o integran dentro del esquema `public` estándar para interactuar de forma directa con los sistemas existentes de la universidad.

---

### `public._usuarios`

Usuarios del panel administrativo (administradores de la DTIC y operadores de facultades). Esta es una tabla central preexistente de la UTO integrada en el sistema para la autenticación unificada.

```sql
CREATE TABLE public._usuarios (
  id_usuario   SERIAL PRIMARY KEY,
  id_persona   INTEGER      NOT NULL,           -- FK lógica a public.personas.id_persona
  apodo        VARCHAR(60)  NOT NULL UNIQUE,    -- nombre de usuario (ej: "admin.dtic")
  clave        VARCHAR(255) NOT NULL,           -- clave legada / MD5
  clave2       VARCHAR(255) NOT NULL DEFAULT '', -- hash seguro scrypt (AdonisJS v6)
  recordatorio VARCHAR(255) DEFAULT '',
  id_estado    BOOLEAN      NOT NULL DEFAULT true
);
```

**Notas:**
- Se utiliza la columna `clave2` para almacenar contraseñas seguras bajo el nuevo backend.
- La relación polimórfica de tokens de AdonisJS asocia a estos usuarios con sus sesiones activas de administración.

---

### `public.app_registro` (antes `carnet_registro`)

Estado del carnet digital de cada persona y del dispositivo móvil vinculado. Los datos académicos se leen de las tablas externas — esta tabla **solo almacena el estado, metadatos de activación y token de dispositivo**.

```sql
CREATE TABLE public.app_registro (
  id                        SERIAL PRIMARY KEY,
  id_persona                INTEGER      NOT NULL,         -- FK lógica a public.personas.id_persona
  estudiante_id             UUID,                          -- ID público generado al activar (visible en la app)
  estado                    VARCHAR(20)  NOT NULL DEFAULT 'inactivo',
  -- valores: 'inactivo' | 'pendiente' | 'activo' | 'expirado'
  activado_por              INTEGER,                       -- FK física a public._usuarios.id_usuario
  activado_en               TIMESTAMPTZ,                   -- timestamp de activación
  expira_en                 TIMESTAMPTZ,                   -- expiración del carnet (3 años) o del QR de activación
  device_token              TEXT,                          -- Token de dispositivo móvil vinculado
  id_carrera                INTEGER,                       -- ID de la carrera del carnet (nullable)
  id_estudiante_academico   INTEGER,                       -- Código académico de estudiante (nullable)
  codigo_verificacion       VARCHAR(10),                   -- Código de verificación de 5 dígitos (2FA manual, nullable)
  codigo_expira_en          TIMESTAMPTZ,                   -- Expiración del código temporal (5 min)
  updated_at                TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT uq_persona_carrera UNIQUE (id_persona, id_carrera)
);

-- Índices de Rendimiento
CREATE INDEX idx_app_registro_estudiante_id ON public.app_registro (estudiante_id);
```

**Estados y transiciones (Carnet):**
- `inactivo`: Sin pago verificado o nunca activado.
- `pendiente`: QR de activación generado (30 min vigencia), esperando escaneo.
- `activo`: Carnet operativo en el dispositivo móvil.
- `expirado`: Límite de 3 años transcurrido desde la activación.

---

### `public.app_tokens` (antes `carnet_tokens` / `access_tokens`)

Almacenamiento de tokens de acceso (OAT) unificado de AdonisJS para gestionar las sesiones de administradores y operadores de forma segura.

```sql
CREATE TABLE public.app_tokens (
  id            SERIAL PRIMARY KEY,
  tokenable_id  INTEGER NOT NULL,              -- ID de usuario (public._usuarios.id_usuario)
  type          VARCHAR(80) NOT NULL,          -- tipo de token ('opaque')
  name          VARCHAR(255) NULL,             -- nombre descriptivo del dispositivo
  hash          VARCHAR(255) NOT NULL,         -- hash del token
  abilities     TEXT NOT NULL,                 -- scopes (normalmente '["*"]')
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at  TIMESTAMPTZ NULL,
  expires_at    TIMESTAMPTZ NULL
);
```

---

### `public.push_tokens`

Tokens de dispositivos registrados para el envío de notificaciones push a través de Firebase Cloud Messaging (FCM).

```sql
CREATE TABLE public.push_tokens (
  id            SERIAL PRIMARY KEY,
  app_id        VARCHAR(50) NOT NULL,          -- identificador de la aplicación móvil (ej: 'bo.edu.uto.informaciones')
  token         VARCHAR(255) NOT NULL UNIQUE,  -- token FCM generado por el dispositivo
  perfil        VARCHAR(50) NOT NULL DEFAULT 'todos',
  user_ci       VARCHAR(20) NULL,              -- CI del usuario asociado (opcional)
  device_os     VARCHAR(20) NULL,              -- sistema operativo ('android' | 'ios')
  activo        BOOLEAN NOT NULL DEFAULT true, -- interruptor general de notificaciones
  roles         TEXT[] NOT NULL DEFAULT '{todos}', -- roles a los que pertenece ('estudiante', 'docente', etc.)
  temas         TEXT[] NOT NULL DEFAULT '{}',  -- temas suscritos ('academico', 'deportivo', 'facultad_X', etc.)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_tokens_app_id ON public.push_tokens (app_id);
CREATE INDEX idx_push_tokens_perfil ON public.push_tokens (perfil);
```

---

### `public.banners`

Imágenes de anuncios y comunicados activos que se renderizan dinámicamente en la cabecera/inicio de la aplicación móvil.

```sql
CREATE TABLE public.banners (
  id                  SERIAL PRIMARY KEY,
  titulo              VARCHAR(150) NULL,
  imagen_path         VARCHAR(255) NOT NULL,         -- nombre del archivo físico en el servidor
  enlace_redireccion  VARCHAR(255) NULL,             -- enlace web externo de redirección
  activo              BOOLEAN NOT NULL DEFAULT true, -- determina si está visible
  created_at          TIMESTAMPTZ NOT NULL,
  updated_at          TIMESTAMPTZ NULL
);
```

---

## Tablas externas (solo lectura)

### `public.personas`
Tabla principal de personas de la universidad. Contiene los datos civiles de estudiantes, docentes y administrativos.

| Columna | Tipo | Descripción |
|---|---|---|
| `id_persona` | `INTEGER` PK | Clave primaria |
| `dip` | `TEXT` | C.I. (DIP) del usuario |
| `nombre_completo` | `TEXT` | Nombre completo en mayúsculas |
| `codigo` | `INTEGER` | Código numérico institucional |
| `digital` | `VARCHAR` | Contiene `"foto"` si el usuario tiene fotografía registrada |
| `id_estado` | `BOOLEAN` | Habilitación de la persona |

---

### `matricula.pagos`
Registro centralizado de matrículas de estudiantes activos.

| Columna | Tipo | Descripción |
|---|---|---|
| `id_pago` | `INTEGER` PK | Clave primaria |
| `id_persona` | `INTEGER` | Relación con `public.personas` |
| `id_carrera` | `INTEGER` | Carrera en la que se matriculó |
| `id_facultad` | `VARCHAR` | Letra identificadora de la facultad (ej: `'G'`) |
| `estado_pago` | `BOOLEAN` | `true` = Pago completado / Habilitado |
| `id_estado` | `BOOLEAN` | `true` = Estudiante regular |

---

## Diagrama de relaciones

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ESQUEMA public (Tablas Activas)                 │
│                                                                        │
│  ┌──────────────────────┐        ┌──────────────────────────────────┐  │
│  │  public._usuarios     │        │  public.app_registro             │  │
│  ├──────────────────────┤        ├──────────────────────────────────┤  │
│  │ id_usuario SERIAL PK ◄┼┐      │ id SERIAL PK                     │  │
│  │ apodo VARCHAR UNIQUE │ │      │ id_persona INTEGER               ├──┐│
│  │ clave VARCHAR        │ └──────│ activado_por INTEGER             │  ││
│  │ clave2 VARCHAR       │        │ estudiante_id UUID               │  ││
│  │ id_estado BOOLEAN    │        │ estado VARCHAR                   │  ││
│  └──────────────────────┘        │ activado_en TIMESTAMPTZ          │  ││
│                                  │ device_token TEXT                │  ││
│  ┌──────────────────────┐        │ id_carrera INTEGER               │  ││
│  │  public.app_tokens   │        └──────────────────────────────────┘  ││
│  ├──────────────────────┤                                              ││
│  │ id SERIAL PK         │        ┌──────────────────────────────────┐  ││
│  │ tokenable_id INT     │        │  public.push_tokens              │  ││
│  │ hash VARCHAR         │        ├──────────────────────────────────┤  ││
│  │ expires_at TIMESTAMPTZ│       │ id SERIAL PK                     │  ││
│  └──────────────────────┘        │ token VARCHAR UNIQUE             │  ││
│                                  │ roles TEXT[]                     │  ││
│  ┌──────────────────────┐        │ temas TEXT[]                     │  ││
│  │  public.banners      │        └──────────────────────────────────┘  ││
│  ├──────────────────────┤                                              ││
│  │ id SERIAL PK         │                                              ││
│  │ imagen_path VARCHAR  │                                              ││
│  │ activo BOOLEAN       │                                              ││
│  └──────────────────────┘                                              ││
└────────────────────────────────────────────────────────────────────────┼┘
                                                                         │
                                                                         ▼ id_persona
┌────────────────────────────────────────────────────────────────────────┐
│                      ESQUEMA public / matricula (Solo Lectura)         │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  public.personas                                                 │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ id_persona INTEGER PK ◄──────────────────────────────────────────┘  │
│  │ dip TEXT (C.I.)                                                     │
│  │ nombre_completo TEXT                                                │
│  └──────────────────────────────────────────────────────────────────┘
```

---

## Historial de Migraciones del Backend

Las migraciones se ejecutan en el siguiente orden secuencial para garantizar la integridad referencial:

1. `1787400000000_create_app_tokens_table.ts` — Crea la tabla de tokens de sesión unificada `public.app_tokens`.
2. `1787400000001_create_app_registro_table.ts` — Crea la tabla `public.app_registro` de estados de carnet.
3. `1787400000002_create_app_push_tokens_table.ts` — Crea la tabla de tokens de notificaciones `public.app_push_tokens`.
4. `1787400000003_create_app_banners_table.ts` — Crea la tabla de banners publicitarios `public.app_banners`.
