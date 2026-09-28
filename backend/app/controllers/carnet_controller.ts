import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import QRCode from 'qrcode'
import QrVerificacionService from '#services/qr_verificacion_service'
import CodigoVerificacionService from '#services/codigo_verificacion_service'
import { FACULTY_MAPPING } from '#helpers/faculty_helper'

export default class CarnetController {
  private qrService = new QrVerificacionService()
  private codigoService = new CodigoVerificacionService()

  private getTipoEstudiante(id: number | null): string {
    if (!id) return 'N/A'
    const mapping: Record<number, string> = {
      1: 'EST. REGULAR',
      2: 'EST. LIBRE',
      5: 'TRASPASO',
      6: 'CARRERA PARALELA',
      8: 'EST. EXTRANJERO',
      10: 'EST. ESPECIAL',
      16: 'PROFESIONAL',
      17: 'EST. EGRESADO',
      19: 'POSTGRADO'
    }
    return mapping[id] || `TIPO ${id}`
  }

  async show({ auth, response }: HttpContext) {
    // Obtain authenticated carnet narrowed to Carnet model
    const carnet = auth.use('estudiante').getUserOrFail()

    const student = await db
      .from('public.personas as p')
      .leftJoin('matricula.pagos as est', (q) => {
        q.on('est.id_persona', 'p.id_persona')
         .andOnVal('est.id_carrera', carnet.idCarrera || 0)
      })
      .leftJoin('public.carreras as ca', 'est.id_carrera', 'ca.id_carrera')
      .leftJoin('public.gestiones as ges', 'est.id_gestion', 'ges.id_gestion')
      .select(
        'p.nombre_completo as nombreCompleto',
        'p.dip',
        db.raw('COALESCE(est.id_estudiante, ?) as codigo', [carnet.idEstudianteAcademico || 0]),
        'ca.carrera',
        'est.id_facultad as idFacultad',
        'p.digital',
        'est.estado_pago as estadoPago',
        'p.correo as correo',
        'p.fec_nacimiento as fecNacimiento',
        'p.direccion as direccion',
        'ges._gestion as periodoAcademico',
        'est.id_tipo_estudiante as idTipoEstudiante'
      )
      .where('p.id_persona', carnet.idPersona)
      .first()

    if (!student) {
      return response.notFound({ error: 'Estudiante no encontrado en el sistema académico.' })
    }

    const hasPagoMatricula = student.estadoPago === true
    const hasPagoEstudiante = await db
      .from('public.estudiantes')
      .where('id_persona', carnet.idPersona)
      .where('id_carrera', carnet.idCarrera || 0)
      .where('estado_pago', true)
      .first()

    if (!hasPagoMatricula || !hasPagoEstudiante) {
      return response.forbidden({
        error: 'Tu matrícula académica no está habilitada.'
      })
    }

    let idTipoEstudiante = student.idTipoEstudiante
    if (!idTipoEstudiante) {
      const estRow = await db
        .from('public.estudiantes')
        .where('id_persona', carnet.idPersona)
        .where('id_carrera', carnet.idCarrera || 0)
        .select('id_tipo_estudiante as idTipoEstudiante')
        .first()
      if (estRow) {
        idTipoEstudiante = estRow.idTipoEstudiante
      }
    }

    return {
      nombreCompleto: student.nombreCompleto,
      dip: student.dip,
      codigo: student.codigo,
      carrera: student.carrera,
      facultad: FACULTY_MAPPING[student.idFacultad] || student.idFacultad || 'Desconocida',
      digital: student.dip ? `https://saga.uto.edu.bo/digital/${student.dip}.jpg` : '',
      estado: carnet.estado,
      activadoEn: carnet.activadoEn,
      expiraEn: carnet.expiraEn,
      carnetId: carnet.id,
      correo: student.correo,
      fecNacimiento: student.fecNacimiento,
      direccion: student.direccion,
      periodoAcademico: student.periodoAcademico,
      tipoEstudiante: this.getTipoEstudiante(idTipoEstudiante)
    }
  }

  async generarQr({ auth }: HttpContext) {
    const carnet = auth.use('estudiante').getUserOrFail()

    // Generar token horario usando el ID incremental del carnet
    const token = this.qrService.generar(String(carnet.id))

    // Convertir token a imagen QR en formato base64
    const qrBase64 = await QRCode.toDataURL(token)

    return {
      qr: qrBase64
    }
  }

  async generarCodigo({ auth }: HttpContext) {
    const carnet = auth.use('estudiante').getUserOrFail()

    // Generar código de verificación de 5 dígitos (válido por 10 min) usando el ID incremental del carnet
    const codigo = await this.codigoService.generar(String(carnet.id))

    return {
      codigo
    }
  }
}
