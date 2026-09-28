# Arquitectura — Servicios Digitales UTO

Sistema de Administración de Servicios y Carnet Universitario Digital de la **Universidad Técnica de Oruro (UTO)**, desarrollado por la DTIC.

---

## Visión General

El ecosistema se compone de tres aplicaciones independientes que se comunican a través de una API REST central:

| Subproyecto | Carpeta / Repositorio | Tecnología | Rol |
|---|---|---|---|
| App Móvil | `app_informaciones` (rep. externo) | React Native + Expo | Portal estudiantil, avisos, carnet digital y enlaces |
| Panel Admin / Consulta | `servicios_app_back/admin/` | React + Vite | Gestión de servicios, banners, notificaciones y operadores |
| Backend | `servicios_app_back/backend/` | AdonisJS v6 + TypeScript | API REST central, autenticación, base de datos y envío push |

---

## Diagrama de Comunicación

```
┌──────────────────────┐        HTTPS / REST        ┌──────────────────────┐
│      App Móvil       │ ─────────────────────────► │                      │
│  React Native + Expo │ ◄───────────────────────── │  Backend AdonisJS v6 │
│                      │                             │                      │
└──────────────────────┘                             │  /api/v1/admin/*     │
                                                     │  /api/v1/app/*       │
┌──────────────────────┐        HTTPS / REST         │  /api/v1/consulta/*  │
│    Panel Admin /     │ ─────────────────────────► │                      │
│    Consulta          │ ◄───────────────────────── │                      │
│    React + Vite      │                             └──────────┬───────────┘
└──────────────────────┘                                        │
                                                     ┌──────────▼───────────┐
                                                     │     PostgreSQL        │
                                                     │  BD miuto_des         │
                                                     │  (solo lectura:       │
                                                     │  public.personas)     │
                                                     │  Tablas de servicios  │
                                                     │  en public (L/E)      │
                                                     └──────────────────────┘
```

Ninguna aplicación cliente accede directamente a la base de datos. Toda operación pasa por el backend.

---

## Módulos Principales del Sistema

### 1. Panel de Administración y Servicios (`admin/`)
*   **Inicio de Sesión**: Autenticación para personal de la DTIC y operadores de facultad (Rol `OPERADOR_NOTIFICACIONES` restringido únicamente al envío de push segmentados).
*   **Notificaciones Push**: Envío segmentado de comunicados a dispositivos móviles filtrando por perfil (estudiante, docente, egresado, etc.), por facultad específica, o por temas generales (académico, deportivo, alertas).
*   **Banners**: Creación, activación/desactivación y eliminación de anuncios que aparecen en la cabecera de la app móvil.
*   **Usuarios / Operadores**: Alta de nuevos operadores vinculando personas reales mediante su C.I. de la base de datos de la UTO.
*   **Carnets (Beta)**: Activación presencial (voucher) y desactivación del carnet digital.

### 2. Módulo de Verificación Pública (`/verificar`)
*   Acceso público directo sin inicio de sesión.
*   Permite a entes externos o personal de seguridad verificar la autenticidad del carnet digital de un estudiante escaneando su QR o ingresando su código de 5 dígitos temporal (2FA).

### 3. Backend (`backend/`)
Expone e implementa los endpoints consumidos por el panel administrativo y la aplicación móvil:

| Controlador / Servicio | Responsabilidad |
|---|---|
| `AuthPanelController` | Autenticación del panel administrativo (tokens en `app_tokens`) |
| `PushNotificationsController` | Gestión de suscripciones de dispositivos (`push_tokens`) y envíos masivos FCM |
| `BannersController` | Carga de archivos y gestión de anuncios (`banners`) |
| `AdminUsersController` | Búsqueda de personas por CI y administración de operadores |
| `AdminCarnetController` | Control de carnets (activar/desactivar) |
| `ConsultaController` | Verificación pública de validez de carnet |
| `AuthEstudianteController` | Activación de dispositivo móvil del estudiante |

---

## Seguridad

*   **Autenticación Admins/Operadores**: Autenticación basada en tokens utilizando la configuración por defecto de AdonisJS v6 (`scrypt`) mapeada a la tabla `public._usuarios`.
*   **Autorización por Rol**: Los operadores del tipo `OPERADOR_NOTIFICACIONES` tienen un enrutado estricto en el frontend que los bloquea de ver la sección de usuarios, banners o carnets.
*   **Notificaciones**: Tokens FCM almacenados de forma segura en `push_tokens` con filtros de segmentación en formato de arreglos PostgreSQL (`text[]`).
*   **QR de Verificación**: Token HMAC-SHA256 de corta duración (1 hora) con firmas encriptadas que garantizan que el QR no sea una captura de pantalla estática.
*   **Código de Verificación**: Algoritmo de generación de 5 dígitos alfanuméricos de un solo uso con expiración de 10 minutos para validación presencial de carnet.

---

## Identidad Institucional y Configuración

| Elemento | Valor |
|---|---|
| Institución | Universidad Técnica de Oruro (UTO) |
| Dirección encargada | DTIC — Dirección de Tecnologías de Información y Comunicación |
| Color primario | Azul `#003087` |
| Color secundario | Dorado `#FFD700` |
| Application ID / Bundle ID | `bo.edu.uto.informaciones` |
| Cuenta institucional | `@uto.edu.bo` (Google Workspace) |
