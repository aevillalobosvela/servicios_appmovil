import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'banners.serve_image': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'consulta.verificar': { paramsTuple?: []; params?: {} }
    'push_notifications.registrar_token': { paramsTuple?: []; params?: {} }
    'banners.get_active': { paramsTuple?: []; params?: {} }
    'auth_panel.login': { paramsTuple?: []; params?: {} }
    'auth_estudiante.activar': { paramsTuple?: []; params?: {} }
    'auth_estudiante.logout': { paramsTuple?: []; params?: {} }
    'carnet.show': { paramsTuple?: []; params?: {} }
    'carnet.generar_qr': { paramsTuple?: []; params?: {} }
    'carnet.generar_codigo': { paramsTuple?: []; params?: {} }
    'auth_panel.logout': { paramsTuple?: []; params?: {} }
    'admin_carnet.index': { paramsTuple?: []; params?: {} }
    'admin_carnet.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin_carnet.desactivar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'push_notifications.obtener_estadisticas': { paramsTuple?: []; params?: {} }
    'push_notifications.enviar_push': { paramsTuple?: []; params?: {} }
    'banners.index': { paramsTuple?: []; params?: {} }
    'banners.store': { paramsTuple?: []; params?: {} }
    'banners.toggle_active': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'banners.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin_users.list_operators': { paramsTuple?: []; params?: {} }
    'admin_users.search_persona': { paramsTuple?: []; params?: {} }
    'admin_users.list_facultades': { paramsTuple?: []; params?: {} }
    'admin_users.create_operator': { paramsTuple?: []; params?: {} }
    'admin_users.toggle_operator': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'banners.serve_image': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'banners.get_active': { paramsTuple?: []; params?: {} }
    'carnet.show': { paramsTuple?: []; params?: {} }
    'carnet.generar_qr': { paramsTuple?: []; params?: {} }
    'carnet.generar_codigo': { paramsTuple?: []; params?: {} }
    'admin_carnet.index': { paramsTuple?: []; params?: {} }
    'admin_carnet.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'push_notifications.obtener_estadisticas': { paramsTuple?: []; params?: {} }
    'banners.index': { paramsTuple?: []; params?: {} }
    'admin_users.list_operators': { paramsTuple?: []; params?: {} }
    'admin_users.search_persona': { paramsTuple?: []; params?: {} }
    'admin_users.list_facultades': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'banners.serve_image': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'banners.get_active': { paramsTuple?: []; params?: {} }
    'carnet.show': { paramsTuple?: []; params?: {} }
    'carnet.generar_qr': { paramsTuple?: []; params?: {} }
    'carnet.generar_codigo': { paramsTuple?: []; params?: {} }
    'admin_carnet.index': { paramsTuple?: []; params?: {} }
    'admin_carnet.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'push_notifications.obtener_estadisticas': { paramsTuple?: []; params?: {} }
    'banners.index': { paramsTuple?: []; params?: {} }
    'admin_users.list_operators': { paramsTuple?: []; params?: {} }
    'admin_users.search_persona': { paramsTuple?: []; params?: {} }
    'admin_users.list_facultades': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'consulta.verificar': { paramsTuple?: []; params?: {} }
    'push_notifications.registrar_token': { paramsTuple?: []; params?: {} }
    'auth_panel.login': { paramsTuple?: []; params?: {} }
    'auth_estudiante.activar': { paramsTuple?: []; params?: {} }
    'auth_estudiante.logout': { paramsTuple?: []; params?: {} }
    'auth_panel.logout': { paramsTuple?: []; params?: {} }
    'admin_carnet.desactivar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'push_notifications.enviar_push': { paramsTuple?: []; params?: {} }
    'banners.store': { paramsTuple?: []; params?: {} }
    'admin_users.create_operator': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'banners.toggle_active': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin_users.toggle_operator': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'banners.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}