/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'banners.serve_image': {
    methods: ["GET","HEAD"]
    pattern: '/uploads/banners/:filename'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { filename: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/banners_controller').default['serveImage']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/banners_controller').default['serveImage']>>>
    }
  }
  'consulta.verificar': {
    methods: ["POST"]
    pattern: '/api/v1/consulta/verificar'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/consulta_controller').default['verificar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/consulta_controller').default['verificar']>>>
    }
  }
  'push_notifications.registrar_token': {
    methods: ["POST"]
    pattern: '/api/v1/notifications/register-token'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/push_notifications_controller').default['registrarToken']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/push_notifications_controller').default['registrarToken']>>>
    }
  }
  'banners.get_active': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/banners/active'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/banners_controller').default['getActive']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/banners_controller').default['getActive']>>>
    }
  }
  'auth_panel.login': {
    methods: ["POST"]
    pattern: '/api/v1/admin/auth'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_panel_controller').default['login']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_panel_controller').default['login']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth_estudiante.activar': {
    methods: ["POST"]
    pattern: '/api/v1/app/activar'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_estudiante_controller').default['activar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_estudiante_controller').default['activar']>>>
    }
  }
  'auth_estudiante.logout': {
    methods: ["POST"]
    pattern: '/api/v1/app/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_estudiante_controller').default['logout']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_estudiante_controller').default['logout']>>>
    }
  }
  'carnet.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/app/carnet'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/carnet_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/carnet_controller').default['show']>>>
    }
  }
  'carnet.generar_qr': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/app/carnet/qr'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/carnet_controller').default['generarQr']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/carnet_controller').default['generarQr']>>>
    }
  }
  'carnet.generar_codigo': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/app/carnet/codigo'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/carnet_controller').default['generarCodigo']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/carnet_controller').default['generarCodigo']>>>
    }
  }
  'auth_panel.logout': {
    methods: ["POST"]
    pattern: '/api/v1/admin/auth/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_panel_controller').default['logout']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_panel_controller').default['logout']>>>
    }
  }
  'admin_carnet.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/carnets'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_carnet_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_carnet_controller').default['index']>>>
    }
  }
  'admin_carnet.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/carnets/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_carnet_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_carnet_controller').default['show']>>>
    }
  }
  'admin_carnet.desactivar': {
    methods: ["POST"]
    pattern: '/api/v1/admin/carnets/:id/desactivar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_carnet_controller').default['desactivar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_carnet_controller').default['desactivar']>>>
    }
  }
  'push_notifications.obtener_estadisticas': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/notifications/stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/push_notifications_controller').default['obtenerEstadisticas']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/push_notifications_controller').default['obtenerEstadisticas']>>>
    }
  }
  'push_notifications.enviar_push': {
    methods: ["POST"]
    pattern: '/api/v1/admin/notifications/send'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/push_notifications_controller').default['enviarPush']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/push_notifications_controller').default['enviarPush']>>>
    }
  }
  'banners.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/banners'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/banners_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/banners_controller').default['index']>>>
    }
  }
  'banners.store': {
    methods: ["POST"]
    pattern: '/api/v1/admin/banners'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/banners_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/banners_controller').default['store']>>>
    }
  }
  'banners.toggle_active': {
    methods: ["PUT"]
    pattern: '/api/v1/admin/banners/:id/toggle'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/banners_controller').default['toggleActive']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/banners_controller').default['toggleActive']>>>
    }
  }
  'banners.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/admin/banners/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/banners_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/banners_controller').default['destroy']>>>
    }
  }
  'admin_users.list_operators': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/operators'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_users_controller').default['listOperators']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_users_controller').default['listOperators']>>>
    }
  }
  'admin_users.search_persona': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/personas/search'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_users_controller').default['searchPersona']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_users_controller').default['searchPersona']>>>
    }
  }
  'admin_users.list_facultades': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/facultades'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_users_controller').default['listFacultades']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_users_controller').default['listFacultades']>>>
    }
  }
  'admin_users.create_operator': {
    methods: ["POST"]
    pattern: '/api/v1/admin/operators'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_users_controller').default['createOperator']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_users_controller').default['createOperator']>>>
    }
  }
  'admin_users.toggle_operator': {
    methods: ["PUT"]
    pattern: '/api/v1/admin/operators/:id/toggle'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_users_controller').default['toggleOperator']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_users_controller').default['toggleOperator']>>>
    }
  }
}
