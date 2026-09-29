import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { randomUUID, createHash } from 'node:crypto'
import ActivacionService from '#services/activacion_service'
import Carnet from '#models/carnet'

export default class AuthEstudianteController {
  private activacionService = new ActivacionService()

  async activar({ request, response }: HttpContext) {
    const { authCode, codeVerifier, deviceToken } = request.only(['authCode', 'codeVerifier', 'deviceToken'])

    if (!authCode || !codeVerifier || !deviceToken) {
      return response.badRequest({ error: 'Se requieren authCode, codeVerifier y deviceToken' })
    }

    // 1. Intercambiar authCode por token de AGETIC
    let idTokenBase64 = ''
    try {
      const tokenResponse = await fetch('https://proveedor.ciudadania.demo.agetic.gob.bo/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: process.env.AGETIC_CLIENT_ID || '',
          redirect_uri: process.env.AGETIC_REDIRECT_URI || '',
          code: authCode,
          code_verifier: codeVerifier,
        }).toString(),
      })
      
      const tokenData: any = await tokenResponse.json()
      if (!tokenResponse.ok) {
        console.error('AGETIC Error:', tokenData)
        return response.badRequest({ error: 'No se pudo validar el inicio de sesión con Ciudadanía Digital' })
      }
      idTokenBase64 = tokenData.id_token
    } catch (e) {
      return response.badRequest({ error: 'Error de comunicación con Ciudadanía Digital' })
    }

    // 2. Extraer CI del id_token
    let ci = ''
    try {
      const payload = JSON.parse(Buffer.from(idTokenBase64.split('.')[1], 'base64').toString())
      ci = payload.preferred_username || payload.uid || payload.documento_identidad || payload.sub
      if (!ci) {
        return response.badRequest({ error: 'El proveedor de identidad no devolvió un Carnet de Identidad válido' })
      }
    } catch(e) {
      return response.badRequest({ error: 'Formato de token de identidad inválido' })
    }

    // Iniciar transacción de base de datos
    const trx = await db.transaction()

    try {
      // 3. Obtener idPersona desde el CI
      const persona = await trx
        .from('public.personas')
        .where('dip', ci)
        .first()

      if (!persona) {
        await trx.rollback()
        return response.notFound({ error: 'Estudiante no encontrado en el sistema académico con el CI: ' + ci })
      }
      
      const idPersona = persona.id_persona
      const hashedDeviceToken = createHash('sha256').update(deviceToken).digest('hex')

      // 4. Buscar carrera habilitada automáticamente (Matriculada y Regular)
      const carreraHabilitada = await trx
        .from('public.estudiantes as e')
        .join('matricula.pagos as mp', (q) => {
          q.on('e.id_persona', 'mp.id_persona').andOn('e.id_carrera', 'mp.id_carrera')
        })
        .where('e.id_persona', idPersona)
        .where('e.estado_pago', true)
        .where('mp.estado_pago', true)
        .select('e.id_carrera as idCarrera', 'e.id_estudiante as idEstudianteAcademico')
        .first()

      if (!carreraHabilitada) {
        await trx.rollback()
        return response.forbidden({ error: 'No estás habilitado académicamente en ninguna carrera. Asegúrate de haber pagado tu matrícula de la gestión actual.' })
      }

      const { idCarrera, idEstudianteAcademico } = carreraHabilitada

      // 5. Buscar o crear el registro de carnet para esta persona y carrera
      let carnet = await Carnet.query({ client: trx })
        .where('idPersona', idPersona)
        .where('idCarrera', idCarrera)
        .forUpdate()
        .first()

      if (!carnet) {
        // Reusar fila vacía si existiera de sistemas antiguos
        const emptyCarnet = await Carnet.query({ client: trx })
          .where('idPersona', idPersona)
          .whereNull('idCarrera')
          .forUpdate()
          .first()
          
        if (emptyCarnet) {
          carnet = emptyCarnet
        } else {
          carnet = new Carnet()
          carnet.idPersona = idPersona
          carnet.estado = 'inactivo'
        }
      }

      // 6. Comprobar si ya estaba activo en este mismo dispositivo (Recuperación de sesión sin costo)
      if (carnet.estado === 'activo' && carnet.deviceToken === hashedDeviceToken) {
        const token = await Carnet.accessTokens.create(carnet, ['*'], { expiresIn: '2 years' })
        await trx.commit()
        return { 
          token: token.value!.release(), 
          carnetId: carnet.id, 
          estado: carnet.estado, 
          expiraEn: carnet.expiraEn, 
          recuperado: true 
        }
      }

      // 7. Verificar aranceles (si no es su primera emisión histórica)
      const carnetPrevio = await trx
        .from('public.app_registro')
        .where('id_persona', idPersona)
        .whereNot('id', carnet.id || 0)
        .where((q) => {
          q.whereIn('estado', ['activo', 'inactivo', 'pendiente']).orWhereNotNull('activado_en')
        })
        .first()

      const yaEmitidoAlgunaVez = carnet.activadoEn != null
      const esPrimeraEmision = !carnetPrevio && !yaEmitidoAlgunaVez

      if (!esPrimeraEmision) {
        // Verificar si pagó el arancel de reposición (Trámite 868)
        const idRcobro = await this.activacionService.buscarCobroDisponible(idPersona, trx)
        if (!idRcobro) {
          await trx.rollback()
          return response.badRequest({
            error: 'Ya tuviste un carnet digital. Para reactivarlo en un nuevo dispositivo, necesitas pagar el arancel de reposición.'
          })
        }
        // Quemar el arancel para que no se use de nuevo
        await this.activacionService.registrarUsoCobro(idPersona, idRcobro, 0, trx)
      }

      // 8. Activar el carnet directamente
      const activadoEn = DateTime.now()
      const expiraEn = activadoEn.plus({ years: 2 })
      const estudianteId = randomUUID()

      carnet.useTransaction(trx)
      carnet.estado = 'activo'
      carnet.estudianteId = estudianteId
      carnet.activadoEn = activadoEn
      carnet.expiraEn = expiraEn
      carnet.deviceToken = hashedDeviceToken
      carnet.idCarrera = idCarrera
      carnet.idEstudianteAcademico = idEstudianteAcademico
      carnet.activadoPor = null // Activación 100% automática por el sistema
      await carnet.save()

      // 9. Generar OAT para el estudiante (vigencia 2 años)
      const token = await Carnet.accessTokens.create(carnet, ['*'], {
        expiresIn: '2 years'
      })

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
