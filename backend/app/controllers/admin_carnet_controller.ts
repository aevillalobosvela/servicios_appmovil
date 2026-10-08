import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
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
    const offset = (page - 1) * limit

    // ── Construcción dinámica del filtro WHERE ─────────────────────────────────
    // Se construye una sola vez y se reutiliza en el CTE para no duplicar lógica.
    const whereFragments: string[] = [
      // Solo personas que sean estudiantes
      `EXISTS (SELECT 1 FROM public.estudiantes e WHERE e.id_persona = p.id_persona)`,
    ]
    const bindings: any[] = []

    if (estado === 'activo') {
      whereFragments.push(`EXISTS (SELECT 1 FROM public.app_registro cr WHERE cr.id_persona = p.id_persona AND cr.estado = 'activo')`)
    } else if (estado === 'expirado') {
      whereFragments.push(`EXISTS    (SELECT 1 FROM public.app_registro cr  WHERE cr.id_persona  = p.id_persona AND cr.estado  = 'expirado')`)
      whereFragments.push(`NOT EXISTS (SELECT 1 FROM public.app_registro cr2 WHERE cr2.id_persona = p.id_persona AND cr2.estado = 'activo')`)
    } else if (estado === 'inactivo') {
      whereFragments.push(`NOT EXISTS (SELECT 1 FROM public.app_registro cr WHERE cr.id_persona = p.id_persona AND cr.estado IN ('activo', 'expirado'))`)
    }

    if (search) {
      const terminoLimpio = search.trim()
      const esNumerico = /^\d+$/.test(terminoLimpio)
      if (esNumerico) {
        whereFragments.push(`p.dip = ?`)
        bindings.push(terminoLimpio)
      } else {
        whereFragments.push(`(p.nombre_completo ILIKE ? OR p.dip ILIKE ?)`)
        bindings.push(`%${terminoLimpio}%`, `%${terminoLimpio}%`)
      }
    }

    const whereSql = whereFragments.join(' AND ')

    // ── CTE único: count + datos paginados en una sola ida a la BD ────────────
    //
    // window function COUNT(*) OVER () calcula el total de filas que cumplan el
    // filtro sin necesidad de una segunda query de conteo. PostgreSQL lo evalúa
    // sobre el mismo conjunto de filas ya filtrado, sin coste adicional.
    //
    // Los agregados de app_registro (estado consolidado, carreras activas) se
    // calculan en un LEFT JOIN con GROUP BY una única vez para todas las personas
    // del resultado, en lugar de una correlated subquery por fila.
    //
    // Los aggregados de estudiantes (totalCarreras) también se pre-agregan en un
    // LEFT JOIN para evitar una segunda correlated subquery por fila.
    const cteResult = await db.rawQuery(
      `
      WITH resumen_registro AS (
        -- Pre-agrega app_registro por persona: una fila por id_persona.
        -- Usa el índice idx_app_registro_persona_estado.
        SELECT
          id_persona,
          SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) AS carreras_activas,
          MAX(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) = 1 AS tiene_activo,
          MAX(CASE WHEN estado = 'expirado' THEN 1 ELSE 0 END) = 1 AS tiene_expirado
        FROM public.app_registro
        GROUP BY id_persona
      ),
      resumen_carreras AS (
        -- Pre-agrega estudiantes por persona: total de carreras únicas.
        SELECT id_persona, COUNT(DISTINCT id_carrera) AS total_carreras
        FROM public.estudiantes
        GROUP BY id_persona
      ),
      base AS (
        SELECT
          p.id_persona,
          p.dip,
          p.nombre_completo,
          p.correo,
          CASE
            WHEN rr.tiene_activo   THEN 'activo'
            WHEN rr.tiene_expirado THEN 'expirado'
            ELSE 'inactivo'
          END                               AS estado,
          COALESCE(rc.total_carreras, 0)    AS total_carreras,
          COALESCE(rr.carreras_activas, 0)  AS carreras_activas,
          COUNT(*) OVER ()                  AS total_count
        FROM public.personas p
        LEFT JOIN resumen_registro rr ON rr.id_persona = p.id_persona
        LEFT JOIN resumen_carreras rc ON rc.id_persona = p.id_persona
        WHERE ${whereSql}
      )
      SELECT * FROM base
      ORDER BY nombre_completo ASC
      LIMIT ? OFFSET ?
      `,
      [...bindings, limit, offset]
    )

    const dataRows: any[] = cteResult.rows
    const total = dataRows.length > 0 ? Number(dataRows[0].total_count) : 0
    const ids = dataRows.map((row: any) => Number(row.id_persona))

    // ── Queries batch paralelas para los ≤10 IDs de esta página ───────────────
    // Se lanzan simultáneamente con Promise.all para eliminar la latencia serial.
    const pagosMap: Record<number, number> = {}
    const habilitadasMap: Record<number, number> = {}

    if (ids.length > 0) {
      const [pagosInfo, habilitadasInfo] = await Promise.all([
        // Pagos 868 disponibles (arancel de reposición no usado)
        db
          .from('tesoro.rcobros as rc')
          .join('tesoro.rtramites as rt', 'rc.id_rtramite', 'rt.id_rtramite')
          .whereIn('rc.id__persona', ids)
          .where('rt.cod_rtramite', '868')
          .whereNotExists(
            db.from('public.emisiones_certificacion as ec').whereRaw('ec.id_rcobro = rc.id_rcobro')
          )
          .select('rc.id__persona as idPersona')
          .count('* as total')
          .groupBy('rc.id__persona'),

        // Carreras con matrícula habilitada (estudiante + pago al día)
        db
          .from('public.estudiantes as e')
          .join('matricula.pagos as mp', (q) => {
            q.on('e.id_persona', 'mp.id_persona').andOn('e.id_carrera', 'mp.id_carrera')
          })
          .whereIn('e.id_persona', ids)
          .where('e.estado_pago', true)
          .where('mp.estado_pago', true)
          .select('e.id_persona as idPersona')
          .count('* as total')
          .groupBy('e.id_persona'),
      ])

      pagosInfo.forEach((item: any) => {
        pagosMap[Number(item.idPersona)] = Number(item.total)
      })
      habilitadasInfo.forEach((item: any) => {
        habilitadasMap[Number(item.idPersona)] = Number(item.total)
      })
    }

    const rows = dataRows.map((row: any) => {
      const idPers = Number(row.id_persona)
      return {
        idPersona:           idPers,
        dip:                 row.dip,
        nombreCompleto:      row.nombre_completo,
        correo:              row.correo,
        digital:             row.dip ? `https://saga.uto.edu.bo/digital/${row.dip}.jpg` : '',
        estado:              row.estado,
        totalCarreras:       Number(row.total_carreras),
        carnerasActivas:     Number(row.carreras_activas),
        carrerasHabilitadas: habilitadasMap[idPers] || 0,
        pagos868Disponibles: pagosMap[idPers] || 0,
      }
    })

    return {
      meta: {
        total,
        perPage:     limit,
        currentPage: page,
        lastPage:    Math.ceil(total / limit) || 1,
        firstPage:   1,
      },
      data: rows,
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
      let activadoPor = null
      let updatedAt = null

      if (carnet) {
        estado = carnet.estado
        carnetId = carnet.id
        activadoEn = carnet.activado_en
        expiraEn = carnet.expira_en
        activadoPor = carnet.activado_por
        updatedAt = carnet.updated_at
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
        updatedAt
      })
    }

    // Determinar el estado consolidado de la persona (para compatibilidad de alto nivel)
    let estadoConsolidado = 'inactivo'
    if (listadoCarreras.some(c => c.estado === 'activo')) {
      estadoConsolidado = 'activo'
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
