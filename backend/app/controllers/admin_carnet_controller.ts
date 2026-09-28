import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import ActivacionService from '#services/activacion_service'
import Carnet from '#models/carnet'
import { FACULTY_MAPPING } from '#helpers/faculty_helper'

export default class AdminCarnetController {
  private activacionService = new ActivacionService()

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

  async index({ request }: HttpContext) {
    const estado = request.input('estado')
    const search = request.input('search')
    const page = Number(request.input('page', 1))
    const limit = Number(request.input('limit', 10))

    // Estado consolidado: activo > pendiente > expirado > inactivo (reutilizable)
    const casoEstado = `
      CASE
        WHEN EXISTS (SELECT 1 FROM public.app_registro cr WHERE cr.id_persona = p.id_persona AND cr.estado = 'activo')    THEN 'activo'
        WHEN EXISTS (SELECT 1 FROM public.app_registro cr WHERE cr.id_persona = p.id_persona AND cr.estado = 'pendiente') THEN 'pendiente'
        WHEN EXISTS (SELECT 1 FROM public.app_registro cr WHERE cr.id_persona = p.id_persona AND cr.estado = 'expirado')  THEN 'expirado'
        ELSE 'inactivo'
      END
    `

    // 1. Conteo de personas únicas con el filtro de estado consolidado
    const countQuery = db
      .from('public.personas as p')
      .whereExists(
        db.from('public.estudiantes as e').whereRaw('e.id_persona = p.id_persona')
      )

    if (estado) {
      countQuery.where(db.raw(casoEstado), estado)
    }

    if (search) {
      const terminoLimpio = search.trim()
      const esNumerico = /^\d+$/.test(terminoLimpio)
      countQuery.where((q) => {
        if (esNumerico) {
          q.where('p.dip', terminoLimpio)
        } else {
          q.whereILike('p.nombre_completo', `%${terminoLimpio}%`)
            .orWhereILike('p.dip', `%${terminoLimpio}%`)
        }
      })
    }

    const countResult = await countQuery.count({ total: '*' })
    const total = Number(countResult[0].total)

    // 2. Consulta de datos paginada — una fila por persona
    const query = db
      .from('public.personas as p')
      .whereExists(
        db.from('public.estudiantes as e').whereRaw('e.id_persona = p.id_persona')
      )
      .select(
        'p.id_persona as idPersona',
        'p.dip',
        'p.nombre_completo as nombreCompleto',
        'p.correo',
        'p.digital',
        db.raw(`(${casoEstado}) AS estado`),
        db.raw(`(
          SELECT COUNT(DISTINCT e2.id_carrera)
          FROM public.estudiantes e2
          WHERE e2.id_persona = p.id_persona
        ) as "totalCarreras"`),
        db.raw(`(
          SELECT COUNT(*)
          FROM public.app_registro cr2
          WHERE cr2.id_persona = p.id_persona AND cr2.estado = 'activo'
        ) as "carnerasActivas"`)
      )

    if (estado) {
      query.where(db.raw(casoEstado), estado)
    }

    if (search) {
      const terminoLimpio = search.trim()
      const esNumerico = /^\d+$/.test(terminoLimpio)
      query.where((q) => {
        if (esNumerico) {
          q.where('p.dip', terminoLimpio)
        } else {
          q.whereILike('p.nombre_completo', `%${terminoLimpio}%`)
            .orWhereILike('p.dip', `%${terminoLimpio}%`)
        }
      })
    }

    const offset = (page - 1) * limit
    const dataRows = await query.orderBy('p.nombre_completo', 'asc').limit(limit).offset(offset)

    // Consultas batch eficientes de habilitación y cobros solo para las 10 personas en pantalla
    const ids = dataRows.map((row: any) => Number(row.idPersona))
    const pagosMap: Record<number, number> = {}
    const habilitadasMap: Record<number, number> = {}

    if (ids.length > 0) {
      // 1. Pagos 868 disponibles (sin usar en emisiones)
      const pagosInfo = await db
        .from('tesoro.rcobros as rc')
        .join('tesoro.rtramites as rt', 'rc.id_rtramite', 'rt.id_rtramite')
        .whereIn('rc.id__persona', ids)
        .where('rt.cod_rtramite', '868')
        .whereNotExists(
          db.from('public.emisiones_certificacion as ec').whereRaw('ec.id_rcobro = rc.id_rcobro')
        )
        .select('rc.id__persona as idPersona')
        .count('* as total')
        .groupBy('rc.id__persona')

      pagosInfo.forEach((item: any) => {
        pagosMap[Number(item.idPersona)] = Number(item.total)
      })

      // 2. Carreras con matrícula al día
      const habilitadasInfo = await db
        .from('public.estudiantes as e')
        .join('matricula.pagos as mp', (q) => {
          q.on('e.id_persona', 'mp.id_persona').andOn('e.id_carrera', 'mp.id_carrera')
        })
        .whereIn('e.id_persona', ids)
        .where('e.estado_pago', true)
        .where('mp.estado_pago', true)
        .select('e.id_persona as idPersona')
        .count('* as total')
        .groupBy('e.id_persona')

      habilitadasInfo.forEach((item: any) => {
        habilitadasMap[Number(item.idPersona)] = Number(item.total)
      })
    }

    const rows = dataRows.map((row: any) => {
      const idPers = Number(row.idPersona)
      return {
        ...row,
        digital: row.dip ? `https://saga.uto.edu.bo/digital/${row.dip}.jpg` : '',
        totalCarreras: Number(row.totalCarreras),
        carnerasActivas: Number(row.carnerasActivas),
        carrerasHabilitadas: habilitadasMap[idPers] || 0,
        pagos868Disponibles: pagosMap[idPers] || 0,
      }
    })

    return {
      meta: {
        total,
        perPage: limit,
        currentPage: page,
        lastPage: Math.ceil(total / limit),
        firstPage: 1,
      },
      data: rows
    }
  }

  async show({ params, response }: HttpContext) {
    const idStr = String(params.id)
    const isNumeric = /^\d+$/.test(idStr)

    // 1. Obtener la persona de public.personas
    const personQuery = db
      .from('public.personas as p')
      .select(
        'p.id_persona as idPersona',
        'p.dip',
        'p.nombre_completo as nombreCompleto',
        'p.correo',
        'p.digital',
        'p.fec_nacimiento as fecNacimiento',
        'p.direccion',
        'p.telefono',
        'p.celular'
      )

    if (isNumeric) {
      personQuery.where('p.id_persona', Number(idStr)).orWhere('p.dip', idStr)
    } else {
      personQuery.where('p.dip', idStr)
    }

    const student = await personQuery.first()

    if (!student) {
      return response.notFound({ error: 'Estudiante no encontrado en el sistema académico' })
    }

    const personaId = student.idPersona

    // 2. Obtener todos los registros de carnet del estudiante
    const carnetRows = await db
      .from('public.app_registro')
      .where('id_persona', personaId)

    // 3. Obtener todos los registros académicos de matricula.pagos
    const pagosRows = await db
      .from('matricula.pagos as est')
      .leftJoin('public.carreras as ca', 'est.id_carrera', 'ca.id_carrera')
      .leftJoin('public.gestiones as ges', 'est.id_gestion', 'ges.id_gestion')
      .where('est.id_persona', personaId)
      .select(
        'est.id_carrera as idCarrera',
        'ca.carrera as carrera',
        'est.id_facultad as idFacultad',
        'est.id_estudiante as idEstudiante',
        'est.estado_pago as estadoPago',
        'ges._gestion as periodoAcademico',
        'est.id_tipo_estudiante as idTipoEstudiante',
        'est.fec_registro as fecRegistro'
      )

    // 4. Obtener todos los registros académicos de public.estudiantes
    const estudiantesRows = await db
      .from('public.estudiantes as est')
      .leftJoin('public.carreras as ca', 'est.id_carrera', 'ca.id_carrera')
      .leftJoin('public.gestiones as ges', 'est.id_gestion', 'ges.id_gestion')
      .where('est.id_persona', personaId)
      .select(
        'est.id_carrera as idCarrera',
        'ca.carrera as carrera',
        'est.id_facultad as idFacultad',
        'est.id_estudiante as idEstudiante',
        'est.estado_pago as estadoPago',
        'est.id_programa as idPrograma',
        'ges._gestion as periodoAcademico',
        'est.id_tipo_estudiante as idTipoEstudiante',
        'est.fec_registro as fecRegistro'
      )

    const deudas = await db
      .from('public.deudores as d')
      .join('public.deudores_responsables as dr', 'd.id_cargo', 'dr.id_cargo')
      .where('d.id_persona', personaId)
      .whereNot('d.estado', 'X')
      .select(
        'd.fecha_reg as fechaReg',
        'd.observacion_deu as observacion',
        'd.estado',
        'dr.lugar'
      )
      .orderBy('d.fecha_reg', 'desc')

    // Verificar si califica para primera emisión gratuita (nunca ha tenido carnet activo, inactivo o con fecha de activación)
    const carnetPrevio = await db
      .from('public.app_registro')
      .where('id_persona', personaId)
      .where((q) => {
        q.whereIn('estado', ['activo', 'inactivo']).orWhereNotNull('activado_en')
      })
      .first()
    const esPrimeraEmision = !carnetPrevio

    const idRcobro = await this.activacionService.buscarCobroDisponible(personaId)
    const tienePagoValor = esPrimeraEmision ? true : !!idRcobro

    const carrerasMap = new Map<number, any>()

    // Procesar pagos (matricula.pagos)
    for (const row of pagosRows) {
      const idCarrera = row.idCarrera
      if (!carrerasMap.has(idCarrera)) {
        carrerasMap.set(idCarrera, {
          idCarrera,
          carrera: row.carrera || 'Desconocida',
          idFacultad: row.idFacultad,
          facultad: FACULTY_MAPPING[row.idFacultad] || row.idFacultad || 'Desconocida',
          idEstudiante: row.idEstudiante,
          idPrograma: 'N/A',
          estadoPagoMatricula: row.estadoPago === true,
          estadoPagoEstudiante: false,
          fecRegistro: row.fecRegistro,
          periodoAcademico: row.periodoAcademico || 'N/A',
          tipoEstudiante: this.getTipoEstudiante(row.idTipoEstudiante),
          fechaInscripcion: row.fecRegistro
        })
      } else {
        const existing = carrerasMap.get(idCarrera)
        if (new Date(row.fecRegistro) > new Date(existing.fecRegistro)) {
          existing.idEstudiante = row.idEstudiante
          existing.estadoPagoMatricula = row.estadoPago === true
          existing.fecRegistro = row.fecRegistro
          existing.periodoAcademico = row.periodoAcademico || existing.periodoAcademico
          existing.tipoEstudiante = this.getTipoEstudiante(row.idTipoEstudiante)
        }
      }
    }

    // Procesar estudiantes (public.estudiantes)
    for (const row of estudiantesRows) {
      const idCarrera = row.idCarrera
      if (!carrerasMap.has(idCarrera)) {
        carrerasMap.set(idCarrera, {
          idCarrera,
          carrera: row.carrera || 'Desconocida',
          idFacultad: row.idFacultad,
          facultad: FACULTY_MAPPING[row.idFacultad] || row.idFacultad || 'Desconocida',
          idEstudiante: row.idEstudiante,
          idPrograma: row.idPrograma || 'N/A',
          estadoPagoMatricula: false,
          estadoPagoEstudiante: row.estadoPago === true,
          fecRegistro: row.fecRegistro,
          periodoAcademico: row.periodoAcademico || 'N/A',
          tipoEstudiante: this.getTipoEstudiante(row.idTipoEstudiante),
          fechaInscripcion: row.fecRegistro
        })
      } else {
        const existing = carrerasMap.get(idCarrera)
        existing.estadoPagoEstudiante = row.estadoPago === true
        if (row.idPrograma) {
          existing.idPrograma = row.idPrograma
        }
        if (row.idTipoEstudiante) {
          existing.tipoEstudiante = this.getTipoEstudiante(row.idTipoEstudiante)
        }
        if (row.periodoAcademico) {
          existing.periodoAcademico = row.periodoAcademico
        }
        if (new Date(row.fecRegistro) > new Date(existing.fecRegistro)) {
          existing.idEstudiante = row.idEstudiante
          existing.fecRegistro = row.fecRegistro
        }
        if (new Date(row.fecRegistro) < new Date(existing.fechaInscripcion)) {
          existing.fechaInscripcion = row.fecRegistro
        }
      }
    }

    const listadoCarreras = []
    for (const c of carrerasMap.values()) {
      const habilitada = c.estadoPagoMatricula && c.estadoPagoEstudiante
      let motivoInhabilitacion = ''
      if (!habilitada) {
        if (c.estadoPagoMatricula && !c.estadoPagoEstudiante) {
          motivoInhabilitacion = 'Matrícula irregular'
        } else if (!c.estadoPagoMatricula && c.estadoPagoEstudiante) {
          motivoInhabilitacion = 'Falta pago de matrícula'
        } else {
          motivoInhabilitacion = 'Sin matrícula ni pago'
        }
      }

      // Buscar el carnet correspondiente a esta carrera
      const carnet = carnetRows.find((cr) => cr.id_carrera === c.idCarrera)
      let estado = 'inactivo'
      let carnetId = 0
      let activadoEn = null
      let expiraEn = null
      let qrBase64 = null
      let activadoPor = null
      let updatedAt = null

      if (carnet) {
        estado = carnet.estado
        carnetId = carnet.id
        activadoEn = carnet.activado_en
        expiraEn = carnet.expira_en
        activadoPor = carnet.activado_por
        updatedAt = carnet.updated_at

        // Validar expiración si está pendiente
        if (estado === 'pendiente') {
          if (!expiraEn) {
            const updatedAtTime = updatedAt ? new Date(updatedAt).getTime() : Date.now()
            const expiresAt = updatedAtTime + 30 * 60 * 1000
            if (Date.now() > expiresAt) {
              await db
                .from('public.app_registro')
                .where('id', carnetId)
                .update({ estado: 'inactivo', expira_en: null, activado_por: null, activado_en: null, id_carrera: null, id_estudiante_academico: null })
              estado = 'inactivo'
              expiraEn = null
            } else {
              await db
                .from('public.app_registro')
                .where('id', carnetId)
                .update({ expira_en: new Date(expiresAt) })
              expiraEn = new Date(expiresAt)
              qrBase64 = await this.activacionService.obtenerQrBase64(personaId, expiresAt)
            }
          } else {
            const expiraEnTime = new Date(expiraEn).getTime()
            if (Date.now() > expiraEnTime) {
              await db
                .from('public.app_registro')
                .where('id', carnetId)
                .update({ estado: 'inactivo', expira_en: null, activado_por: null, activado_en: null, id_carrera: null, id_estudiante_academico: null })
              estado = 'inactivo'
              expiraEn = null
            } else {
              qrBase64 = await this.activacionService.obtenerQrBase64(personaId, expiraEnTime)
            }
          }
        }
      }

      listadoCarreras.push({
        idCarrera: c.idCarrera,
        carrera: c.carrera,
        idFacultad: c.idFacultad,
        facultad: c.facultad,
        idEstudiante: c.idEstudiante,
        idPrograma: c.idPrograma,
        estadoPagoMatricula: c.estadoPagoMatricula,
        estadoPagoEstudiante: c.estadoPagoEstudiante,
        habilitada,
        motivoInhabilitacion,
        periodoAcademico: c.periodoAcademico,
        tipoEstudiante: c.tipoEstudiante,
        fechaInscripcion: c.fechaInscripcion,
        carnetId,
        estado,
        activadoEn,
        expiraEn,
        activadoPor,
        qr: qrBase64,
        updatedAt
      })
    }

    // Determinar el estado consolidado de la persona (para compatibilidad de alto nivel)
    let estadoConsolidado = 'inactivo'
    if (listadoCarreras.some(c => c.estado === 'activo')) {
      estadoConsolidado = 'activo'
    } else if (listadoCarreras.some(c => c.estado === 'pendiente')) {
      estadoConsolidado = 'pendiente'
    } else if (listadoCarreras.some(c => c.estado === 'expirado')) {
      estadoConsolidado = 'expirado'
    }

    return {
      idPersona: student.idPersona,
      dip: student.dip,
      nombreCompleto: student.nombreCompleto,
      correo: student.correo,
      digital: student.dip ? `https://saga.uto.edu.bo/digital/${student.dip}.jpg` : '',
      estado: estadoConsolidado,
      tienePagoValor,
      esPrimeraEmision,
      deudas,
      carreras: listadoCarreras,
      fecNacimiento: student.fecNacimiento,
      direccion: student.direccion,
      telefono: student.telefono,
      celular: student.celular
    }
  }

  async generarActivacion({ request, response, auth }: HttpContext) {
    const { idPersona, idCarrera, idEstudiante } = request.only(['idPersona', 'idCarrera', 'idEstudiante'])
    if (!idPersona || !idCarrera || !idEstudiante) {
      return response.badRequest({ error: 'Se requiere idPersona, idCarrera e idEstudiante' })
    }

    const personaId = Number(idPersona)
    const carreraId = Number(idCarrera)
    const estudianteIdAcademico = Number(idEstudiante)
    if (isNaN(personaId) || isNaN(carreraId) || isNaN(estudianteIdAcademico)) {
      return response.badRequest({ error: 'Los IDs proporcionados deben ser números válidos' })
    }

    // Validar habilitación académica de la carrera seleccionada
    const pagoMatricula = await db
      .from('matricula.pagos')
      .where('id_persona', personaId)
      .where('id_carrera', carreraId)
      .where('estado_pago', true)
      .first()

    if (!pagoMatricula) {
      return response.badRequest({ error: 'El estudiante no cuenta con la matrícula pagada en la carrera seleccionada.' })
    }

    const pagoEstudiante = await db
      .from('public.estudiantes')
      .where('id_persona', personaId)
      .where('id_carrera', carreraId)
      .where('estado_pago', true)
      .first()

    if (!pagoEstudiante) {
      return response.badRequest({ error: 'El estudiante tiene una matrícula irregular en la carrera seleccionada.' })
    }

    // Verificar si califica para primera emisión gratuita (nunca ha tenido carnet activo, inactivo o con fecha de activación)
    const carnetPrevio = await db
      .from('public.app_registro')
      .where('id_persona', personaId)
      .where((q) => {
        q.whereIn('estado', ['activo', 'inactivo']).orWhereNotNull('activado_en')
      })
      .first()
    const esPrimeraEmision = !carnetPrevio

    if (!esPrimeraEmision) {
      // Verificar si el estudiante tiene un cobro disponible del trámite 868 (reposición de carnet)
      const idRcobro = await this.activacionService.buscarCobroDisponible(personaId)
      if (!idRcobro) {
        return response.badRequest({
          error: 'No se encontró un pago de arancel de reposición de carnet disponible para este estudiante o ya fue utilizado.'
        })
      }
    }

    const qrBase64 = await this.activacionService.generarQrActivacion(personaId)

    // Buscar si ya existe una credencial para esa carrera
    let carnet = await Carnet.query()
      .where('idPersona', personaId)
      .where('idCarrera', carreraId)
      .first()

    if (!carnet) {
      // Reusar fila vacía de carnet si existe
      const emptyCarnet = await Carnet.query()
        .where('idPersona', personaId)
        .whereNull('idCarrera')
        .first()

      if (emptyCarnet) {
        carnet = emptyCarnet
      } else {
        // Crear un nuevo registro
        carnet = new Carnet()
        carnet.idPersona = personaId
        carnet.estado = 'inactivo'
      }
    }

    const adminUser = auth.getUserOrFail()
    const expiraEn = DateTime.now().plus({ minutes: 30 })

    carnet.estado = 'pendiente'
    carnet.activadoPor = adminUser.id
    carnet.idCarrera = carreraId
    carnet.idEstudianteAcademico = estudianteIdAcademico
    carnet.expiraEn = expiraEn
    await carnet.save()

    return { qr: qrBase64 }
  }

  async desactivar({ params, response }: HttpContext) {
    // Buscar el carnet específico por su clave primaria ID
    const carnet = await Carnet.find(params.id)
    if (!carnet) {
      return response.notFound({ error: 'Registro de carnet no encontrado' })
    }

    carnet.estado = 'inactivo'
    carnet.estudianteId = null
    carnet.activadoPor = null
    carnet.activadoEn = null
    carnet.expiraEn = null
    carnet.deviceToken = null
    // Nota: Mantenemos idCarrera y idEstudianteAcademico vinculados para conservar el histórico
    await carnet.save()

    return { message: 'Carnet digital desactivado correctamente' }
  }
}
