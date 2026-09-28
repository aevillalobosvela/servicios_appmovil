import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import QrVerificacionService from '#services/qr_verificacion_service'
import CodigoVerificacionService from '#services/codigo_verificacion_service'
import { FACULTY_MAPPING } from '#helpers/faculty_helper'

export default class ConsultaController {
  private qrService = new QrVerificacionService()
  private codigoService = new CodigoVerificacionService()

  async verificar({ request, response }: HttpContext) {
    const { carnetId, qrToken, codigo } = request.only(['carnetId', 'qrToken', 'codigo'])

    if (!carnetId) {
      return response.badRequest({ error: 'Se requiere el carnetId' })
    }

    // Buscar carnet activo
    const carnet = await db
      .from('public.app_registro')
      .where('id', carnetId)
      .where('estado', 'activo')
      .first()

    if (!carnet) {
      return response.badRequest({ error: 'El carnet consultado no se encuentra activo o no existe.' })
    }

    // Validar credencial temporal de verificación
    if (qrToken) {
      const qrValido = this.qrService.validar(qrToken, String(carnet.id))
      if (!qrValido) {
        return response.badRequest({ error: 'Código QR de verificación inválido o expirado.' })
      }
    } else if (codigo) {
      const codigoValido = await this.codigoService.validar(codigo, String(carnet.id))
      if (!codigoValido) {
        return response.badRequest({ error: 'Código de verificación de 5 dígitos inválido o vencido.' })
      }
    } else {
      return response.badRequest({ error: 'Se requiere el código QR o el código manual para verificar.' })
    }

    // Obtener datos académicos del estudiante
    const student = await db
      .from('public.personas as p')
      .leftJoin('matricula.pagos as est', (q) => {
        q.on('est.id_persona', 'p.id_persona')
         .andOnVal('est.id_carrera', carnet.id_carrera || 0)
      })
      .leftJoin('public.carreras as ca', 'est.id_carrera', 'ca.id_carrera')
      .select(
        'p.nombre_completo as nombreCompleto',
        'p.dip',
        db.raw('COALESCE(est.id_estudiante, ?) as codigo', [carnet.id_estudiante_academico || 0]),
        'ca.carrera',
        'est.id_facultad as idFacultad',
        'p.digital',
        'est.estado_pago as estadoPago'
      )
      .where('p.id_persona', carnet.id_persona)
      .first()

    if (!student) {
      return response.notFound({ error: 'Estudiante no encontrado en el sistema académico.' })
    }

    const hasPagoMatricula = student.estadoPago === true
    const hasPagoEstudiante = await db
      .from('public.estudiantes')
      .where('id_persona', carnet.id_persona)
      .where('id_carrera', carnet.id_carrera || 0)
      .where('estado_pago', true)
      .first()

    if (!hasPagoMatricula || !hasPagoEstudiante) {
      return response.badRequest({
        error: 'El estudiante no cuenta con la matrícula pagada o habilitada.'
      })
    }

    return {
      valid: true,
      student: {
        nombreCompleto: student.nombreCompleto,
        dip: student.dip,
        codigo: student.codigo,
        carrera: student.carrera,
        facultad: FACULTY_MAPPING[student.idFacultad] || student.idFacultad || 'Desconocida',
        digital: student.dip ? `https://saga.uto.edu.bo/digital/${student.dip}.jpg` : ''
      }
    }
  }
}
