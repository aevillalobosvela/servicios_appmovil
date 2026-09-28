/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'consulta.verificar': {
    methods: ["POST"],
    pattern: '/api/v1/consulta/verificar',
    tokens: [{"old":"/api/v1/consulta/verificar","type":0,"val":"api","end":""},{"old":"/api/v1/consulta/verificar","type":0,"val":"v1","end":""},{"old":"/api/v1/consulta/verificar","type":0,"val":"consulta","end":""},{"old":"/api/v1/consulta/verificar","type":0,"val":"verificar","end":""}],
    types: placeholder as Registry['consulta.verificar']['types'],
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
  'admin_carnet.generar_activacion': {
    methods: ["POST"],
    pattern: '/api/v1/admin/carnets/activar',
    tokens: [{"old":"/api/v1/admin/carnets/activar","type":0,"val":"api","end":""},{"old":"/api/v1/admin/carnets/activar","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/carnets/activar","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/carnets/activar","type":0,"val":"carnets","end":""},{"old":"/api/v1/admin/carnets/activar","type":0,"val":"activar","end":""}],
    types: placeholder as Registry['admin_carnet.generar_activacion']['types'],
  },
  'admin_carnet.desactivar': {
    methods: ["POST"],
    pattern: '/api/v1/admin/carnets/:id/desactivar',
    tokens: [{"old":"/api/v1/admin/carnets/:id/desactivar","type":0,"val":"api","end":""},{"old":"/api/v1/admin/carnets/:id/desactivar","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/carnets/:id/desactivar","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/carnets/:id/desactivar","type":0,"val":"carnets","end":""},{"old":"/api/v1/admin/carnets/:id/desactivar","type":1,"val":"id","end":""},{"old":"/api/v1/admin/carnets/:id/desactivar","type":0,"val":"desactivar","end":""}],
    types: placeholder as Registry['admin_carnet.desactivar']['types'],
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
