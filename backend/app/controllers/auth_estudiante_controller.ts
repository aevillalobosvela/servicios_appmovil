import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { randomUUID, createHash } from 'node:crypto'
import ActivacionService from '#services/activacion_service'
import Carnet from '#models/carnet'

export default class AuthEstudianteController {
  private activacionService = new ActivacionService()

  async activar({ request, response }: HttpContext) {
    const { qrToken, deviceToken } = request.only(['qrToken', 'deviceToken'])

    if (!qrToken || !deviceToken) {
      return response.badRequest({ error: 'Se requieren qrToken y deviceToken' })
    }

    // 1. Validar criptográficamente el token QR de activación
    const idPersona = this.activacionService.validarQrActivacion(qrToken)
    if (!idPersona) {
      return response.badRequest({ error: 'El código QR de activación es inválido o ha expirado' })
    }

    // Iniciar transacción de base de datos
    const trx = await db.transaction()

    try {
      const hashedDeviceToken = createHash('sha256').update(deviceToken).digest('hex')

      // 2. Buscar carnet y verificar que esté en estado 'pendiente' con bloqueo FOR UPDATE
      const carnet = await Carnet.query({ client: trx })
        .where('idPersona', idPersona)
        .where('estado', 'pendiente')
        .forUpdate()
        .first()

      if (!carnet) {
        // Verificar si ya fue activado por este mismo dispositivo (re-intento idempotente)
        const carnetActivo = await Carnet.query({ client: trx })
          .where('idPersona', idPersona)
          .where('estado', 'activo')
          .where('deviceToken', hashedDeviceToken)
          .first()

        if (carnetActivo) {
          // Generar nuevo OAT para recuperar la sesión
          const token = await Carnet.accessTokens.create(carnetActivo, ['*'], {
            expiresIn: '2 years'
          })
          await trx.commit()
          return {
            token: token.value!.release(),
            carnetId: carnetActivo.id,
            estado: carnetActivo.estado,
            expiraEn: carnetActivo.expiraEn,
            recuperado: true
          }
        }

        await trx.rollback()
        return response.badRequest({
          error: 'Este código QR ya ha sido utilizado o no se encuentra en espera de activación'
        })
      }

      // 3. Obtener el C.I. (dip) de la persona desde public.personas usando la transacción
      const persona = await trx
        .from('public.personas')
        .where('id_persona', idPersona)
        .first()

      if (!persona) {
        await trx.rollback()
        return response.notFound({ error: 'Estudiante no encontrado en el sistema académico' })
      }

      // 4. Registrar el dispositivo en el carnet
      // (hashedDeviceToken ya fue calculado al inicio)

      // Verificar si califica para primera emisión gratuita (nunca ha tenido carnet activo, inactivo o con fecha de activación)
      const carnetPrevio = await trx
        .from('public.app_registro')
        .where('id_persona', idPersona)
        .whereNot('id', carnet.id)
        .where((q) => {
          q.whereIn('estado', ['activo', 'inactivo']).orWhereNotNull('activado_en')
        })
        .first()
      const esPrimeraEmision = !carnetPrevio

      if (!esPrimeraEmision) {
        // Verificar si el estudiante tiene un cobro de arancel (reposición 868) disponible
        const idRcobro = await this.activacionService.buscarCobroDisponible(idPersona, trx)
        if (!idRcobro) {
          await trx.rollback()
          return response.badRequest({
            error: 'No se encontró un pago de arancel de reposición de carnet disponible para este estudiante o ya fue utilizado.'
          })
        }

        // Registrar el uso del cobro para inhabilitarlo (quemar arancel 868)
        await this.activacionService.registrarUsoCobro(idPersona, idRcobro, carnet.activadoPor || 0, trx)
      }

      // 5. Activar el carnet
      const activadoEn = DateTime.now()
      const expiraEn = activadoEn.plus({ years: 2 })
      const estudianteId = randomUUID()

      carnet.useTransaction(trx)
      carnet.estado = 'activo'
      carnet.estudianteId = estudianteId
      carnet.activadoEn = activadoEn
      carnet.expiraEn = expiraEn
      carnet.deviceToken = hashedDeviceToken
      await carnet.save()

      // 6. Generar OAT para el estudiante (vigencia 2 años)
      const token = await Carnet.accessTokens.create(carnet, ['*'], {
        expiresIn: '2 years'
      })

      // Confirmar transacción
      await trx.commit()

      return {
        token: token.value!.release(),
        carnetId: carnet.id,
        estado: carnet.estado,
        expiraEn: carnet.expiraEn
      }
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async activarParalela({ request, response, auth }: HttpContext) {
    const { qrToken, deviceToken } = request.only(['qrToken', 'deviceToken'])

    if (!qrToken || !deviceToken) {
      return response.badRequest({ error: 'Se requieren qrToken y deviceToken' })
    }

    // 1. Validar criptográficamente el token QR de activación
    const idPersona = this.activacionService.validarQrActivacion(qrToken)
    if (!idPersona) {
      return response.badRequest({ error: 'El código QR de activación es inválido o ha expirado' })
    }

    // Obtener carnet autenticado activo actual (validación de pertenencia de persona)
    const carnetActivo = auth.use('estudiante').getUserOrFail()
    if (carnetActivo.idPersona !== idPersona) {
      return response.badRequest({
        error: 'El código QR de activación pertenece a otro estudiante. No coincide tu identidad.'
      })
    }

    // Iniciar transacción de base de datos
    const trx = await db.transaction()

    try {
      const hashedDeviceToken = createHash('sha256').update(deviceToken).digest('hex')

      // 2. Buscar carnet y verificar que esté en estado 'pendiente' con bloqueo FOR UPDATE
      const carnet = await Carnet.query({ client: trx })
        .where('idPersona', idPersona)
        .where('estado', 'pendiente')
        .forUpdate()
        .first()

      if (!carnet) {
        // Verificar si ya fue activado por este mismo dispositivo (re-intento idempotente)
        const carnetActivo = await Carnet.query({ client: trx })
          .where('idPersona', idPersona)
          .where('estado', 'activo')
          .where('deviceToken', hashedDeviceToken)
          .first()

        if (carnetActivo) {
          // Generar nuevo OAT para recuperar la sesión
          const token = await Carnet.accessTokens.create(carnetActivo, ['*'], {
            expiresIn: '2 years'
          })
          await trx.commit()
          return {
            token: token.value!.release(),
            carnetId: carnetActivo.id,
            estado: carnetActivo.estado,
            expiraEn: carnetActivo.expiraEn,
            recuperado: true
          }
        }

        await trx.rollback()
        return response.badRequest({
          error: 'No tienes ninguna activación de carrera paralela pendiente en el sistema.'
        })
      }

      // Verificar si califica para primera emisión gratuita (única por persona)
      const carnetPrevio = await trx
        .from('public.app_registro')
        .where('id_persona', idPersona)
        .whereNot('id', carnet.id)
        .where((q) => {
          q.whereIn('estado', ['activo', 'inactivo']).orWhereNotNull('activado_en')
        })
        .first()
      const esPrimeraEmision = !carnetPrevio

      if (!esPrimeraEmision) {
        // Verificar si el estudiante tiene un cobro de arancel (reposición 868) disponible
        const idRcobro = await this.activacionService.buscarCobroDisponible(idPersona, trx)
        if (!idRcobro) {
          await trx.rollback()
          return response.badRequest({
            error: 'No se encontró un pago de arancel de reposición de carnet disponible para tu segunda carrera o ya fue utilizado.'
          })
        }

        // Registrar el uso del cobro para inhabilitarlo (quemar arancel 868)
        await this.activacionService.registrarUsoCobro(idPersona, idRcobro, carnet.activadoPor || 0, trx)
      }

      // 4. Activar el carnet con el deviceToken enviado
      const activadoEn = DateTime.now()
      const expiraEn = activadoEn.plus({ years: 2 })
      const estudianteId = randomUUID()

      carnet.useTransaction(trx)
      carnet.estado = 'activo'
      carnet.estudianteId = estudianteId
      carnet.activadoEn = activadoEn
      carnet.expiraEn = expiraEn
      carnet.deviceToken = hashedDeviceToken
      await carnet.save()

      // 5. Generar OAT para este carnet específico (vigencia 2 años)
      const token = await Carnet.accessTokens.create(carnet, ['*'], {
        expiresIn: '2 years'
      })

      // Confirmar transacción
      await trx.commit()

      return {
        token: token.value!.release(),
        carnetId: carnet.id,
        estado: carnet.estado,
        expiraEn: carnet.expiraEn
      }
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async logout({ auth }: HttpContext) {
    // Narrow down authenticated user to Carnet model
    const carnet = auth.use('estudiante').getUserOrFail()

    if (carnet.currentAccessToken) {
      await Carnet.accessTokens.delete(carnet, carnet.currentAccessToken.identifier)
    }

    // Cambiar estado a inactivo y limpiar metadata de activación y dispositivo
    carnet.estado = 'inactivo'
    carnet.estudianteId = null
    carnet.activadoPor = null
    carnet.activadoEn = null
    carnet.expiraEn = null
    carnet.deviceToken = null
    await carnet.save()

    return {
      message: 'Sesión cerrada correctamente'
    }
  }
}
