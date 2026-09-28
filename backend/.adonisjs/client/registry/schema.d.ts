/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
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
  'admin_carnet.generar_activacion': {
    methods: ["POST"]
    pattern: '/api/v1/admin/carnets/activar'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_carnet_controller').default['generarActivacion']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_carnet_controller').default['generarActivacion']>>>
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
}
