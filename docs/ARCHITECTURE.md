# Arquitectura del Sistema: Servicios Digitales UTO

El sistema de "Servicios Digitales UTO" es una solución centralizada y segura diseñada para la Universidad Técnica de Oruro (UTO) con el objetivo primario de emitir y gestionar el **Carnet Digital Universitario**.

## 1. Componentes del Ecosistema

El ecosistema está conformado por tres componentes principales:

### 1.1. Aplicación Móvil (React Native + Expo)
- **Rol:** Cliente final para el estudiante.
- **Responsabilidades:** 
  - Solicitar autenticación inicial al estudiante utilizando **Ciudadanía Digital (AGETIC)**.
  - Almacenar tokens seguros en el dispositivo.
  - Presentar la credencial digital, la cual cuenta con características anti-fraude (reloj sincronizado local, micro-animaciones, bloqueo de capturas de pantalla, brillo automático).
  - Proveer validación offline al portador mediante la generación de un Código QR dinámico o Código de Verificación Alfanumérico, que expira en minutos.

### 1.2. Backend Central (AdonisJS v6 + PostgreSQL)
- **Rol:** Motor de reglas de negocio y servidor de datos (API REST).
- **Responsabilidades:**
  - Validar la situación académica y financiera del estudiante cruzando datos transaccionales heredados (inscripciones, pagos de matrícula).
  - Efectuar el proceso de activación post-AGETIC. Registra el dispositivo y el token de acceso.
  - Gestionar el consumo del trámite de pago universitario (868) en caso de reposiciones.
  - Generar e invalidar firmas criptográficas (QRs y códigos).
  - Ejecutar tareas asíncronas (Cron Jobs) para la desactivación automática de carnets que hayan alcanzado su fecha de expiración (`ExpiracionService`).

### 1.3. Panel Administrativo (React + Vite)
- **Rol:** Centro de monitoreo y control (Kill-switch) para la Dirección de TIC.
- **Responsabilidades:**
  - Buscar y visualizar en tiempo real el estado detallado de cualquier estudiante.
  - **Desactivación Remota (Kill-Switch):** En caso de robo del celular del estudiante, el operador puede inhabilitar remotamente la credencial (borra el device token e invalida accesos).
  - Publicación y gestión de Banners informativos que la aplicación móvil consume y muestra al estudiante.
  - Gestión de operadores administrativos del sistema.

## 2. Flujo Principal de Activación (App Móvil)

A diferencia de modelos anteriores que requerían a un funcionario escaneando QRs, este sistema es **100% autogestionado**:

1. **Intención:** El estudiante abre la app e inicia el flujo de obtención.
2. **Requisitos:** El Backend revisa que el estudiante esté inscrito (matricula) y con el pago del arancel de carnet (o exento por ser primerizo).
3. **Identidad:** La app lanza un navegador WebView apuntando al servicio de **Ciudadanía Digital**.
4. **Callback y Activación:** Tras validarse en Ciudadanía Digital (usualmente requiere validación 2FA por SMS/WhatsApp por parte de AGETIC), se dispara la ruta `/app/activar`. El backend registra el `device_token` del celular, marca el carnet como `activo` y retorna el Token JWT.

## 3. Seguridad de Validación

Para validar un Carnet Digital en comedores, transporte universitario o bibliotecas sin depender de que el controlador tenga conexión a internet rápida:

1. El estudiante presiona el botón "Validar" en la App.
2. La app hace una petición rápida para obtener un QR (generado y firmado en el backend en `QrVerificacionService`).
3. Este QR es validado asincrónicamente mediante criptografía simétrica (HMAC SHA-256) usando el `APP_KEY` del backend por las apps controladoras.
4. Si el estudiante no tiene datos, se puede generar un código alfanumérico temporal (`CodigoVerificacionService`) válido por 10 minutos para ser introducido manualmente por el conductor o encargado.

## 4. Despliegue (Docker)

Todo el backend y el panel de administración corren orquestados mediante un único `docker-compose.yml`, que define volúmenes para carga de banners, red interna segura, y variables dinámicas de entorno que se inyectan tanto en el frontend como en el backend.
