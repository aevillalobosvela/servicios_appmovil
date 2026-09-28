/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const AuthPanelController = () => import('#controllers/auth_panel_controller')
const AdminCarnetController = () => import('#controllers/admin_carnet_controller')
const ConsultaController = () => import('#controllers/consulta_controller')
const AuthEstudianteController = () => import('#controllers/auth_estudiante_controller')
const CarnetController = () => import('#controllers/carnet_controller')
const PushNotificationsController = () => import('#controllers/push_notifications_controller')
const BannersController = () => import('#controllers/banners_controller')
const AdminUsersController = () => import('#controllers/admin_users_controller')

router.get('/', () => {
  return { hello: 'world' }
})

// Servir imágenes de banners de forma pública
router.get('/uploads/banners/:filename', [BannersController, 'serveImage'])

router
  .group(() => {
    // Public verification endpoint (CONSULTA)
    router.post('consulta/verificar', [ConsultaController, 'verificar'])
      .use(middleware.rateLimiter())

    // Public token registration for push notifications (APP)
    router.post('notifications/register-token', [PushNotificationsController, 'registrarToken'])
      .use(middleware.rateLimiter())

    // Public active banner endpoint (APP)
    router.get('banners/active', [BannersController, 'getActive'])
      .use(middleware.rateLimiter())

    // Public authentication endpoint for admin panel
    router.post('admin/auth', [AuthPanelController, 'login'])
      .use(middleware.rateLimiter())

    // Public student activation endpoint (APP)
    router.post('app/activar', [AuthEstudianteController, 'activar'])
      .use(middleware.rateLimiter())

    // Protected student app endpoints (APP)
    router
      .group(() => {
        router.post('app/logout', [AuthEstudianteController, 'logout'])
        router.post('app/activar-paralela', [AuthEstudianteController, 'activarParalela'])
        router.get('app/carnet', [CarnetController, 'show'])
        router.get('app/carnet/qr', [CarnetController, 'generarQr'])
        router.get('app/carnet/codigo', [CarnetController, 'generarCodigo'])
      })
      .use(middleware.student())

    // Protected admin panel endpoints (ADMIN)
    router
      .group(() => {
        router.post('auth/logout', [AuthPanelController, 'logout'])
        
        router.get('carnets', [AdminCarnetController, 'index'])
        router.get('carnets/:id', [AdminCarnetController, 'show'])
        router.post('carnets/activar', [AdminCarnetController, 'generarActivacion'])
        router.post('carnets/:id/desactivar', [AdminCarnetController, 'desactivar'])

        // Push Notifications Admin Endpoints
        router.get('notifications/stats', [PushNotificationsController, 'obtenerEstadisticas'])
        router.post('notifications/send', [PushNotificationsController, 'enviarPush'])

        // Banners Admin Endpoints
        router.get('banners', [BannersController, 'index'])
        router.post('banners', [BannersController, 'store'])
        router.put('banners/:id/toggle', [BannersController, 'toggleActive'])
        router.delete('banners/:id', [BannersController, 'destroy'])

        // Operators Admin Endpoints
        router.get('operators', [AdminUsersController, 'listOperators'])
        router.get('personas/search', [AdminUsersController, 'searchPersona'])
        router.get('facultades', [AdminUsersController, 'listFacultades'])
        router.post('operators', [AdminUsersController, 'createOperator'])
        router.put('operators/:id/toggle', [AdminUsersController, 'toggleOperator'])

        // Temporary endpoint to check authenticated state
        router.get('auth/me', async ({ auth }) => {
          const user = auth.use('api').getUserOrFail()
          return {
            id: user.id,
            usuario: user.usuario,
            nombre: user.nombre,
          }
        })
      })
      .prefix('admin')
      .use(middleware.admin())
  })
  .prefix('/api/v1')

