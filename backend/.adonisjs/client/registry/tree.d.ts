/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  banners: {
    serveImage: typeof routes['banners.serve_image']
    getActive: typeof routes['banners.get_active']
    index: typeof routes['banners.index']
    store: typeof routes['banners.store']
    toggleActive: typeof routes['banners.toggle_active']
    destroy: typeof routes['banners.destroy']
  }
  consulta: {
    verificar: typeof routes['consulta.verificar']
  }
  pushNotifications: {
    registrarToken: typeof routes['push_notifications.registrar_token']
    obtenerEstadisticas: typeof routes['push_notifications.obtener_estadisticas']
    enviarPush: typeof routes['push_notifications.enviar_push']
  }
  authPanel: {
    login: typeof routes['auth_panel.login']
    logout: typeof routes['auth_panel.logout']
  }
  authEstudiante: {
    activar: typeof routes['auth_estudiante.activar']
    logout: typeof routes['auth_estudiante.logout']
  }
  carnet: {
    show: typeof routes['carnet.show']
    generarQr: typeof routes['carnet.generar_qr']
    generarCodigo: typeof routes['carnet.generar_codigo']
  }
  adminCarnet: {
    index: typeof routes['admin_carnet.index']
    show: typeof routes['admin_carnet.show']
    desactivar: typeof routes['admin_carnet.desactivar']
  }
  adminUsers: {
    listOperators: typeof routes['admin_users.list_operators']
    searchPersona: typeof routes['admin_users.search_persona']
    listFacultades: typeof routes['admin_users.list_facultades']
    createOperator: typeof routes['admin_users.create_operator']
    toggleOperator: typeof routes['admin_users.toggle_operator']
  }
}
