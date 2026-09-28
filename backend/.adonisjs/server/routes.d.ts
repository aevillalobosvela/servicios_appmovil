import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'consulta.verificar': { paramsTuple?: []; params?: {} }
    'auth_panel.login': { paramsTuple?: []; params?: {} }
    'auth_estudiante.activar': { paramsTuple?: []; params?: {} }
    'auth_estudiante.logout': { paramsTuple?: []; params?: {} }
    'carnet.show': { paramsTuple?: []; params?: {} }
    'carnet.generar_qr': { paramsTuple?: []; params?: {} }
    'carnet.generar_codigo': { paramsTuple?: []; params?: {} }
    'auth_panel.logout': { paramsTuple?: []; params?: {} }
    'admin_carnet.index': { paramsTuple?: []; params?: {} }
    'admin_carnet.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin_carnet.generar_activacion': { paramsTuple?: []; params?: {} }
    'admin_carnet.desactivar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'carnet.show': { paramsTuple?: []; params?: {} }
    'carnet.generar_qr': { paramsTuple?: []; params?: {} }
    'carnet.generar_codigo': { paramsTuple?: []; params?: {} }
    'admin_carnet.index': { paramsTuple?: []; params?: {} }
    'admin_carnet.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'carnet.show': { paramsTuple?: []; params?: {} }
    'carnet.generar_qr': { paramsTuple?: []; params?: {} }
    'carnet.generar_codigo': { paramsTuple?: []; params?: {} }
    'admin_carnet.index': { paramsTuple?: []; params?: {} }
    'admin_carnet.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'consulta.verificar': { paramsTuple?: []; params?: {} }
    'auth_panel.login': { paramsTuple?: []; params?: {} }
    'auth_estudiante.activar': { paramsTuple?: []; params?: {} }
    'auth_estudiante.logout': { paramsTuple?: []; params?: {} }
    'auth_panel.logout': { paramsTuple?: []; params?: {} }
    'admin_carnet.generar_activacion': { paramsTuple?: []; params?: {} }
    'admin_carnet.desactivar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}