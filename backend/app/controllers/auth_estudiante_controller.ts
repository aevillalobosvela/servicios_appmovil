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
    let tokenData: any = null
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
      
      tokenData = await tokenResponse.json()
      if (!tokenResponse.ok) {
        console.error('AGETIC Error:', tokenData)
        return response.badRequest({ error: 'No se pudo validar el inicio de sesión con Ciudadanía Digital' })
      }
    } catch (e) {
      return response.badRequest({ error: 'Error de comunicación con Ciudadanía Digital' })
    }

    // 2. Extraer CI usando el endpoint userinfo de AGETIC
    let ci = ''
    try {
      const userInfoResponse = await fetch('https://proveedor.ciudadania.demo.agetic.gob.bo/me', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      })
      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text()
        console.error('==== ERROR USERINFO RESPONSE ====', userInfoResponse.status, errorText)
        throw new Error('Userinfo endpoint returned ' + userInfoResponse.status)
      }
      const userInfo: any = await userInfoResponse.json()
      console.log('==== AGETIC USERINFO RECIBIDO ====', JSON.stringify(userInfo, null, 2))
      
      ci = userInfo?.profile?.documento_identidad?.numero_documento || 
           userInfo?.documento_identidad?.numero_documento || 
           userInfo?.numero_documento || 
           userInfo?.ci || 
           userInfo?.preferred_username || 
           userInfo?.uid || 
           userInfo?.sub
           
      // Limpiar el CI si la base de datos lo tiene sin guion o sin sufijo de ser necesario.
      // Por ahora lo pasamos tal cual viene de AGETIC (Ej: 2235394978-6T)

      
      // Si a pesar de todo, preferred_username o sub es un UUID, intentamos filtrar
      if (ci && ci.length > 20) {
         // Es un UUID, no nos sirve como CI. Forzamos error para ver el log.
         ci = '' 
      }

      if (!ci) {
        return response.badRequest({ error: 'El proveedor de identidad no devolvió un Carnet de Identidad válido en /userinfo' })
      }
    } catch(e) {
      console.error('==== ERROR OBTENIENDO USERINFO ====', e)
      return response.badRequest({ error: 'Error al consultar el perfil de usuario de Ciudadanía Digital' })
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
          q.whereIn('estado', ['activo', 'inactivo']).orWhereNotNull('activado_en')
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


  async logout({ auth }: HttpContext) {
    // Narrow down authenticated user to Carnet model
    const carnet = auth.use('estudiante').getUserOrFail()

    if (carnet.currentAccessToken) {
      await Carnet.accessTokens.delete(carnet, carnet.currentAccessToken.identifier)
    }

    // Ya NO cambiamos el estado a 'inactivo' ni limpiamos el deviceToken.
    // Esto permite que el estudiante pueda volver a iniciar sesión en este mismo
    // dispositivo sin consumir un nuevo arancel de reposición.

    return {
      message: 'Sesión cerrada correctamente'
    }
  }
}
