import type { HttpContext } from '@adonisjs/core/http'
import PushToken from '#models/push_token'
import db from '@adonisjs/lucid/services/db'
import env from '#start/env'

export default class PushNotificationsController {
  /**
   * Registrar o actualizar token de notificación push enviado desde apps móviles.
   * POST /api/v1/notifications/register-token
   */
  async registrarToken({ request, response }: HttpContext) {
    const { appId, token, perfil, userCi, deviceOs, activo, roles, temas } = request.only([
      'appId',
      'token',
      'perfil',
      'userCi',
      'deviceOs',
      'activo',
      'roles',
      'temas',
    ])

    if (!appId || !token) {
      return response.badRequest({
        message: 'Los campos appId y token son requeridos.',
      })
    }

    try {
      const existing = await PushToken.findBy('token', token)

      if (existing) {
        existing.appId = appId
        if (perfil) existing.perfil = perfil
        if (userCi) existing.userCi = userCi
        if (deviceOs) existing.deviceOs = deviceOs
        if (activo !== undefined) existing.activo = activo
        if (roles) existing.roles = roles
        if (temas) existing.temas = temas
        await existing.save()

        return response.ok({
          success: true,
          status: 'updated',
          data: existing,
        })
      }

      const created = await PushToken.create({
        appId,
        token,
        perfil: perfil || 'todos',
        userCi: userCi || null,
        deviceOs: deviceOs || null,
        activo: activo !== undefined ? activo : true,
        roles: roles || ['todos'],
        temas: temas || [],
      })

      return response.created({
        success: true,
        status: 'created',
        data: created,
      })
    } catch (error) {
      console.error('Error al registrar push token:', error)
      return response.internalServerError({
        message: 'No se pudo registrar el token de notificación.',
      })
    }
  }

  /**
   * Obtener métricas y conteo de dispositivos registrados.
   * GET /api/v1/admin/notifications/stats
   */
  async obtenerEstadisticas({ response }: HttpContext) {
    try {
      const totalResult = await PushToken.query().count('* as total')
      const porAppResult = await PushToken.query()
        .select('app_id')
        .count('* as total')
        .groupBy('app_id')

      const porPerfilResult = await PushToken.query()
        .select('perfil')
        .count('* as total')
        .groupBy('perfil')

      const total = Number((totalResult[0] as any).$extras.total || 0)
      const porApp = porAppResult.map((item: any) => ({
        appId: item.appId,
        total: Number(item.$extras.total || 0),
      }))
      const porPerfil = porPerfilResult.map((item: any) => ({
        perfil: item.perfil,
        total: Number(item.$extras.total || 0),
      }))

      return response.ok({
        total,
        porApp,
        porPerfil,
      })
    } catch (error) {
      console.error('Error al obtener estadísticas de push tokens:', error)
      return response.internalServerError({
        message: 'Error al consultar métricas de dispositivos.',
      })
    }
  }

  /**
   * Enviar notificación push masiva o segmentada desde el panel web Admin.
   * POST /api/v1/admin/notifications/send
   */
  async enviarPush({ auth, request, response }: HttpContext) {
    const { appId, roles, tema, titulo, mensaje, facultades, ciEspecifico, tipoEstudiante } = request.only([
      'appId',
      'roles',
      'tema',
      'titulo',
      'mensaje',
      'facultades',
      'ciEspecifico',
      'tipoEstudiante',
    ])

    if (!titulo || !mensaje) {
      return response.badRequest({
        message: 'El título y el mensaje son campos obligatorios.',
      })
    }

    try {
      const admin = auth.use('api').getUserOrFail()

      // Obtener el rol del administrador en el sistema 7
      const roleRes = await db
        .from('public._usr_roles as ur')
        .join('public._roles as r', 'ur.id_rol', 'r.id_rol')
        .where('ur.id_usuario', admin.id)
        .where('r.id_sistema', env.get('SYSTEM_ID') || 7)
        .where('ur.id_estado', true)
        .where('r.id_estado', true)
        .select('r.rol')
        .first()

      const adminRol = roleRes ? roleRes.rol : null

      // Aplicar restricción de facultad si no es el administrador global
      let idFacultad = null
      if (adminRol !== 'ADMINISTRADOR_APP') {
        const facultyRes = await db
          .from('public._usr_facultades')
          .where('id_usuario', admin.id)
          .where('id_estado', true)
          .select('id_facultad')
          .first()
        idFacultad = facultyRes ? facultyRes.id_facultad : null
      }

      // Determinar facultades objetivo
      let targetFacultades: string[] = []
      if (adminRol === 'OPERADOR_NOTIFICACIONES') {
        if (idFacultad) {
          targetFacultades = [idFacultad]
        }
      } else {
        if (facultades && Array.isArray(facultades) && facultades.length > 0) {
          targetFacultades = facultades
        }
      }

      const query = PushToken.query().where('activo', true)

      if (appId && appId !== 'todos') {
        query.where('app_id', appId)
      }

      if (roles && Array.isArray(roles) && roles.length > 0 && !roles.includes('todos')) {
        const rolesPg = '{' + roles.join(',') + '}'
        query.whereRaw('(roles && ?::varchar[] OR \'todos\' = ANY(roles))', [rolesPg])
      }

      if (tema && tema !== 'todos') {
        query.whereRaw('?::varchar = ANY(temas)', [tema])
      }

      // Aplicar segmentación por C.I. individual
      if (ciEspecifico && ciEspecifico.trim().length > 0) {
        query.where('user_ci', ciEspecifico.trim())
      }

      // Aplicar segmentación por Antigüedad / Tipo Estudiante
      if (tipoEstudiante === 'nuevos' || tipoEstudiante === 'antiguos') {
        const currentYear = new Date().getFullYear()

        query.whereExists((subquery) => {
          subquery
            .from('public.personas as p')
            .join('public.estudiantes as e', 'p.id_persona', 'e.id_persona')
            .join('public.gestiones as g', 'e.id_gestion_ing', 'g.id_gestion')
            .whereRaw('p.dip = app_push_tokens.user_ci')

          if (tipoEstudiante === 'nuevos') {
            subquery.where('g.anio', '>=', currentYear)
          } else {
            subquery.where('g.anio', '<', currentYear)
          }
        })
      }

      // Aplicar segmentación por facultades si hay alguna seleccionada o restringida
      if (targetFacultades.length > 0) {
        query.where((orQuery) => {
          orQuery
            .whereExists((subquery) => {
              subquery
                .from('public.personas as p')
                .join('public.estudiantes as e', 'p.id_persona', 'e.id_persona')
                .join('public.carreras as c', 'e.id_carrera', 'c.id_carrera')
                .whereRaw('p.dip = app_push_tokens.user_ci')
                .whereIn('c.id_facultad', targetFacultades)
            })
            .orWhereRaw('(temas && ?::varchar[])', ['{' + targetFacultades.map(f => `facultad_${f}`).join(',') + '}'])
        })
      }

      const tokensList = await query

      if (tokensList.length === 0) {
        return response.badRequest({
          message: 'No se encontraron dispositivos registrados para los criterios seleccionados.',
        })
      }

      // Estructurar payloads para la API de Expo Push con canal de alta prioridad Android
      const messages = tokensList.map((t) => ({
        to: t.token,
        sound: 'default',
        title: titulo,
        body: mensaje,
        channelId: 'default',
        priority: 'high',
        badge: 1,
        data: { appId, roles, tema },
      }))

      // Agrupar en paquetes de máximo 100 registros (límite recomendado por Expo)
      const chunkSize = 100
      const chunks: (typeof messages)[] = []
      for (let i = 0; i < messages.length; i += chunkSize) {
        chunks.push(messages.slice(i, i + chunkSize))
      }

      let enviadosExitosos = 0
      let fallidos = 0
      let expoTickets: any[] = []

      for (const chunk of chunks) {
        try {
          // Pequeño delay entre lotes para respetar el rate limit de Expo (600 tokens/seg)
          if (expoTickets.length > 0 || enviadosExitosos > 0 || fallidos > 0) {
            await new Promise((resolve) => setTimeout(resolve, 150))
          }

          const res = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(chunk),
          })

          const data: any = await res.json()

          if (res.ok && data?.data) {
            enviadosExitosos += chunk.length
            expoTickets = expoTickets.concat(data.data)
          } else {
            fallidos += chunk.length
            console.error('Lote rechazado por Expo Push API:', data)
          }
        } catch (err) {
          fallidos += chunk.length
          console.error('Error de red al enviar lote a la API de Expo Push:', err)
        }
      }

      return response.ok({
        success: true,
        totalDispositivos: tokensList.length,
        enviados: enviadosExitosos,
        fallidos,
        tickets: expoTickets,
        message: fallidos > 0
          ? `Notificación despachada con advertencias: ${enviadosExitosos} enviados, ${fallidos} fallidos.`
          : `Notificación despachada exitosamente a ${enviadosExitosos} dispositivo(s).`,
      })
    } catch (error) {
      console.error('Error al procesar envío de notificaciones:', error)
      return response.internalServerError({
        message: 'Ocurrió un error inesperado al despachar las notificaciones.',
      })
    }
  }
}
