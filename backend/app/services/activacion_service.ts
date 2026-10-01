import crypto from 'node:crypto'

import db from '@adonisjs/lucid/services/db'
import env from '#start/env'

export default class ActivacionService {
  /**
   * Verifica si existe un pago registrado para el estudiante en el último mes
   */
  async verificarPago(idPersona: number): Promise<boolean> {
    const pagoMatricula = await db
      .from('matricula.pagos')
      .where('id_persona', idPersona)
      .where('estado_pago', true)
      .first()

    if (!pagoMatricula) return false

    const pagoEstudiante = await db
      .from('public.estudiantes')
      .where('id_persona', idPersona)
      .where('estado_pago', true)
      .first()

    return !!pagoEstudiante
  }

  /**
   * Busca si el estudiante tiene un cobro disponible (no usado) del trámite '868'
   */
  async buscarCobroDisponible(idPersona: number, client?: any): Promise<number | null> {
    const queryClient = client || db

    const cobro = await queryClient
      .from('tesoro.rcobros as rc')
      .join('tesoro.rtramites as rt', 'rc.id_rtramite', 'rt.id_rtramite')
      .where('rc.id__persona', idPersona)
      .where('rt.cod_rtramite', '868')
      .whereNotExists(
        queryClient
          .from('public.emisiones_certificacion as ec')
          .whereRaw('ec.id_rcobro = rc.id_rcobro')
      )
      .select('rc.id_rcobro')
      .first()

    return cobro ? cobro.id_rcobro : null
  }

  /**
   * Registra el uso de un cobro en public.emisiones_certificacion para marcarlo como utilizado ("quemado")
   */
  async registrarUsoCobro(idPersona: number, idRcobro: number, idUsuarioAdmin: number, client?: any): Promise<void> {
    const queryClient = client || db
    await queryClient.rawQuery(`
      INSERT INTO public.emisiones_certificacion (
        id_emisiones_certificacion,
        id_persona,
        id_rcobro,
        fecha_emision,
        correlativo,
        id_usuario,
        estado,
        id_estado,
        observacion
      ) VALUES (
        (SELECT COALESCE(MAX(id_emisiones_certificacion), 0) + 1 FROM public.emisiones_certificacion),
        :idPersona,
        :idRcobro,
        NOW(),
        (SELECT COALESCE(MAX(correlativo), 0) + 1 FROM public.emisiones_certificacion),
        :idUsuarioAdmin,
        'A',
        true,
        'Carnet digital emitido'
      )
    `, {
      idPersona,
      idRcobro,
      idUsuarioAdmin
    })
  }
}
