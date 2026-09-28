/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  consulta: {
    verificar: typeof routes['consulta.verificar']
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
    generarActivacion: typeof routes['admin_carnet.generar_activacion']
    desactivar: typeof routes['admin_carnet.desactivar']
  }
}
