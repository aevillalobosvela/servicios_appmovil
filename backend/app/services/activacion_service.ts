import crypto from 'node:crypto'
import QRCode from 'qrcode'
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
   * Genera el token y el código QR en base64 para un timestamp dado, sin interactuar con la base de datos
   */
  async obtenerQrBase64(idPersona: number, expiresAt: number): Promise<string> {
    const dataToSign = `${idPersona}:${expiresAt}`
    const signature = crypto
      .createHmac('sha256', env.get('APP_KEY').release())
      .update(dataToSign)
      .digest('hex')

    const token = `${dataToSign}:${signature}`
    return QRCode.toDataURL(token)
  }

  /**
   * Genera un QR con token firmado por 30 minutos sin modificar la base de datos
   */
  async generarQrActivacion(idPersona: number): Promise<string> {
    const expiresAt = Date.now() + 30 * 60 * 1000 // 30 minutos
    return this.obtenerQrBase64(idPersona, expiresAt)
  }

  /**
   * Valida criptográficamente el token del QR de activación
   */
  validarQrActivacion(token: string): number | null {
    try {
      const parts = token.split(':')
      if (parts.length !== 3) return null

      const [idPersonaStr, expiresAtStr, signature] = parts
      const expiresAt = parseInt(expiresAtStr, 10)
      if (isNaN(expiresAt) || Date.now() > expiresAt) return null

      const dataToSign = `${idPersonaStr}:${expiresAtStr}`
      const expectedSignature = crypto
        .createHmac('sha256', env.get('APP_KEY').release())
        .update(dataToSign)
        .digest('hex')

      if (signature !== expectedSignature) return null

      return parseInt(idPersonaStr, 10)
    } catch {
      return null
    }
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
