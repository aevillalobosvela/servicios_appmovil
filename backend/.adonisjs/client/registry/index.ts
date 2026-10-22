/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'banners.serve_image': {
    methods: ["GET","HEAD"],
    pattern: '/uploads/banners/:filename',
    tokens: [{"old":"/uploads/banners/:filename","type":0,"val":"uploads","end":""},{"old":"/uploads/banners/:filename","type":0,"val":"banners","end":""},{"old":"/uploads/banners/:filename","type":1,"val":"filename","end":""}],
    types: placeholder as Registry['banners.serve_image']['types'],
  },
  'consulta.verificar': {
    methods: ["POST"],
    pattern: '/api/v1/consulta/verificar',
    tokens: [{"old":"/api/v1/consulta/verificar","type":0,"val":"api","end":""},{"old":"/api/v1/consulta/verificar","type":0,"val":"v1","end":""},{"old":"/api/v1/consulta/verificar","type":0,"val":"consulta","end":""},{"old":"/api/v1/consulta/verificar","type":0,"val":"verificar","end":""}],
    types: placeholder as Registry['consulta.verificar']['types'],
  },
  'push_notifications.registrar_token': {
    methods: ["POST"],
    pattern: '/api/v1/notifications/register-token',
    tokens: [{"old":"/api/v1/notifications/register-token","type":0,"val":"api","end":""},{"old":"/api/v1/notifications/register-token","type":0,"val":"v1","end":""},{"old":"/api/v1/notifications/register-token","type":0,"val":"notifications","end":""},{"old":"/api/v1/notifications/register-token","type":0,"val":"register-token","end":""}],
    types: placeholder as Registry['push_notifications.registrar_token']['types'],
  },
  'banners.get_active': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/banners/active',
    tokens: [{"old":"/api/v1/banners/active","type":0,"val":"api","end":""},{"old":"/api/v1/banners/active","type":0,"val":"v1","end":""},{"old":"/api/v1/banners/active","type":0,"val":"banners","end":""},{"old":"/api/v1/banners/active","type":0,"val":"active","end":""}],
    types: placeholder as Registry['banners.get_active']['types'],
  },
  'auth_panel.login': {
    methods: ["POST"],
    pattern: '/api/v1/admin/auth',
    tokens: [{"old":"/api/v1/admin/auth","type":0,"val":"api","end":""},{"old":"/api/v1/admin/auth","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/auth","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/auth","type":0,"val":"auth","end":""}],
    types: placeholder as Registry['auth_panel.login']['types'],
  },
  'auth_estudiante.activar': {
    methods: ["POST"],
    pattern: '/api/v1/app/activar',
    tokens: [{"old":"/api/v1/app/activar","type":0,"val":"api","end":""},{"old":"/api/v1/app/activar","type":0,"val":"v1","end":""},{"old":"/api/v1/app/activar","type":0,"val":"app","end":""},{"old":"/api/v1/app/activar","type":0,"val":"activar","end":""}],
    types: placeholder as Registry['auth_estudiante.activar']['types'],
  },
  'auth_estudiante.logout': {
    methods: ["POST"],
    pattern: '/api/v1/app/logout',
    tokens: [{"old":"/api/v1/app/logout","type":0,"val":"api","end":""},{"old":"/api/v1/app/logout","type":0,"val":"v1","end":""},{"old":"/api/v1/app/logout","type":0,"val":"app","end":""},{"old":"/api/v1/app/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['auth_estudiante.logout']['types'],
  },
  'carnet.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/app/carnet',
    tokens: [{"old":"/api/v1/app/carnet","type":0,"val":"api","end":""},{"old":"/api/v1/app/carnet","type":0,"val":"v1","end":""},{"old":"/api/v1/app/carnet","type":0,"val":"app","end":""},{"old":"/api/v1/app/carnet","type":0,"val":"carnet","end":""}],
    types: placeholder as Registry['carnet.show']['types'],
  },
  'carnet.generar_qr': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/app/carnet/qr',
    tokens: [{"old":"/api/v1/app/carnet/qr","type":0,"val":"api","end":""},{"old":"/api/v1/app/carnet/qr","type":0,"val":"v1","end":""},{"old":"/api/v1/app/carnet/qr","type":0,"val":"app","end":""},{"old":"/api/v1/app/carnet/qr","type":0,"val":"carnet","end":""},{"old":"/api/v1/app/carnet/qr","type":0,"val":"qr","end":""}],
    types: placeholder as Registry['carnet.generar_qr']['types'],
  },
  'carnet.generar_codigo': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/app/carnet/codigo',
    tokens: [{"old":"/api/v1/app/carnet/codigo","type":0,"val":"api","end":""},{"old":"/api/v1/app/carnet/codigo","type":0,"val":"v1","end":""},{"old":"/api/v1/app/carnet/codigo","type":0,"val":"app","end":""},{"old":"/api/v1/app/carnet/codigo","type":0,"val":"carnet","end":""},{"old":"/api/v1/app/carnet/codigo","type":0,"val":"codigo","end":""}],
    types: placeholder as Registry['carnet.generar_codigo']['types'],
  },
  'auth_panel.logout': {
    methods: ["POST"],
    pattern: '/api/v1/admin/auth/logout',
    tokens: [{"old":"/api/v1/admin/auth/logout","type":0,"val":"api","end":""},{"old":"/api/v1/admin/auth/logout","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/auth/logout","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/auth/logout","type":0,"val":"auth","end":""},{"old":"/api/v1/admin/auth/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['auth_panel.logout']['types'],
  },
  'admin_carnet.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/carnets',
    tokens: [{"old":"/api/v1/admin/carnets","type":0,"val":"api","end":""},{"old":"/api/v1/admin/carnets","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/carnets","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/carnets","type":0,"val":"carnets","end":""}],
    types: placeholder as Registry['admin_carnet.index']['types'],
  },
  'admin_carnet.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/carnets/:id',
    tokens: [{"old":"/api/v1/admin/carnets/:id","type":0,"val":"api","end":""},{"old":"/api/v1/admin/carnets/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/carnets/:id","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/carnets/:id","type":0,"val":"carnets","end":""},{"old":"/api/v1/admin/carnets/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin_carnet.show']['types'],
  },
  'admin_carnet.desactivar': {
    methods: ["POST"],
    pattern: '/api/v1/admin/carnets/:id/desactivar',
    tokens: [{"old":"/api/v1/admin/carnets/:id/desactivar","type":0,"val":"api","end":""},{"old":"/api/v1/admin/carnets/:id/desactivar","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/carnets/:id/desactivar","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/carnets/:id/desactivar","type":0,"val":"carnets","end":""},{"old":"/api/v1/admin/carnets/:id/desactivar","type":1,"val":"id","end":""},{"old":"/api/v1/admin/carnets/:id/desactivar","type":0,"val":"desactivar","end":""}],
    types: placeholder as Registry['admin_carnet.desactivar']['types'],
  },
  'push_notifications.obtener_estadisticas': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/notifications/stats',
    tokens: [{"old":"/api/v1/admin/notifications/stats","type":0,"val":"api","end":""},{"old":"/api/v1/admin/notifications/stats","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/notifications/stats","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/notifications/stats","type":0,"val":"notifications","end":""},{"old":"/api/v1/admin/notifications/stats","type":0,"val":"stats","end":""}],
    types: placeholder as Registry['push_notifications.obtener_estadisticas']['types'],
  },
  'push_notifications.enviar_push': {
    methods: ["POST"],
    pattern: '/api/v1/admin/notifications/send',
    tokens: [{"old":"/api/v1/admin/notifications/send","type":0,"val":"api","end":""},{"old":"/api/v1/admin/notifications/send","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/notifications/send","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/notifications/send","type":0,"val":"notifications","end":""},{"old":"/api/v1/admin/notifications/send","type":0,"val":"send","end":""}],
    types: placeholder as Registry['push_notifications.enviar_push']['types'],
  },
  'banners.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/banners',
    tokens: [{"old":"/api/v1/admin/banners","type":0,"val":"api","end":""},{"old":"/api/v1/admin/banners","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/banners","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/banners","type":0,"val":"banners","end":""}],
    types: placeholder as Registry['banners.index']['types'],
  },
  'banners.store': {
    methods: ["POST"],
    pattern: '/api/v1/admin/banners',
    tokens: [{"old":"/api/v1/admin/banners","type":0,"val":"api","end":""},{"old":"/api/v1/admin/banners","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/banners","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/banners","type":0,"val":"banners","end":""}],
    types: placeholder as Registry['banners.store']['types'],
  },
  'banners.toggle_active': {
    methods: ["PUT"],
    pattern: '/api/v1/admin/banners/:id/toggle',
    tokens: [{"old":"/api/v1/admin/banners/:id/toggle","type":0,"val":"api","end":""},{"old":"/api/v1/admin/banners/:id/toggle","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/banners/:id/toggle","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/banners/:id/toggle","type":0,"val":"banners","end":""},{"old":"/api/v1/admin/banners/:id/toggle","type":1,"val":"id","end":""},{"old":"/api/v1/admin/banners/:id/toggle","type":0,"val":"toggle","end":""}],
    types: placeholder as Registry['banners.toggle_active']['types'],
  },
  'banners.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/admin/banners/:id',
    tokens: [{"old":"/api/v1/admin/banners/:id","type":0,"val":"api","end":""},{"old":"/api/v1/admin/banners/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/banners/:id","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/banners/:id","type":0,"val":"banners","end":""},{"old":"/api/v1/admin/banners/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['banners.destroy']['types'],
  },
  'admin_users.list_operators': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/operators',
    tokens: [{"old":"/api/v1/admin/operators","type":0,"val":"api","end":""},{"old":"/api/v1/admin/operators","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/operators","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/operators","type":0,"val":"operators","end":""}],
    types: placeholder as Registry['admin_users.list_operators']['types'],
  },
  'admin_users.search_persona': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/personas/search',
    tokens: [{"old":"/api/v1/admin/personas/search","type":0,"val":"api","end":""},{"old":"/api/v1/admin/personas/search","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/personas/search","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/personas/search","type":0,"val":"personas","end":""},{"old":"/api/v1/admin/personas/search","type":0,"val":"search","end":""}],
    types: placeholder as Registry['admin_users.search_persona']['types'],
  },
  'admin_users.list_facultades': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/facultades',
    tokens: [{"old":"/api/v1/admin/facultades","type":0,"val":"api","end":""},{"old":"/api/v1/admin/facultades","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/facultades","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/facultades","type":0,"val":"facultades","end":""}],
    types: placeholder as Registry['admin_users.list_facultades']['types'],
  },
  'admin_users.create_operator': {
    methods: ["POST"],
    pattern: '/api/v1/admin/operators',
    tokens: [{"old":"/api/v1/admin/operators","type":0,"val":"api","end":""},{"old":"/api/v1/admin/operators","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/operators","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/operators","type":0,"val":"operators","end":""}],
    types: placeholder as Registry['admin_users.create_operator']['types'],
  },
  'admin_users.toggle_operator': {
    methods: ["PUT"],
    pattern: '/api/v1/admin/operators/:id/toggle',
    tokens: [{"old":"/api/v1/admin/operators/:id/toggle","type":0,"val":"api","end":""},{"old":"/api/v1/admin/operators/:id/toggle","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/operators/:id/toggle","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/operators/:id/toggle","type":0,"val":"operators","end":""},{"old":"/api/v1/admin/operators/:id/toggle","type":1,"val":"id","end":""},{"old":"/api/v1/admin/operators/:id/toggle","type":0,"val":"toggle","end":""}],
    types: placeholder as Registry['admin_users.toggle_operator']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
