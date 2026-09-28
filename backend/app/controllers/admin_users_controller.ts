import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import env from '#start/env'

export default class AdminUsersController {
  async listOperators({ response }: HttpContext) {
    try {
      const list = await db
        .from('public._usr_roles as ur')
        .join('public._usuarios as u', 'ur.id_usuario', 'u.id_usuario')
        .join('public.personas as p', 'u.id_persona', 'p.id_persona')
        .join('public._roles as r', 'ur.id_rol', 'r.id_rol')
        .leftJoin('public._usr_facultades as uf', (q) => {
          q.on('u.id_usuario', 'uf.id_usuario').andOnVal('uf.id_estado', true)
        })
        .leftJoin('public.facultades as f', 'uf.id_facultad', 'f.id_facultad')
        .where('r.id_sistema', env.get('SYSTEM_ID') || 7)
        .select(
          'ur.id_usr_rol as idUsrRol',
          'u.id_usuario as idUsuario',
          'u.apodo as usuario',
          'p.nombre_completo as nombreCompleto',
          'p.dip',
          'r.rol',
          'f.id_facultad as idFacultad',
          'f.facultad as facultad',
          'ur.id_estado as activo'
        )
        .orderBy('p.nombre_completo', 'asc')

      return response.ok(list)
    } catch (error) {
      console.error('[listOperators Error]:', error)
      return response.internalServerError({ error: 'Error al listar operadores' })
    }
  }

  async searchPersona({ request, response }: HttpContext) {
    const dip = request.input('dip')
    if (!dip) {
      return response.badRequest({ error: 'Se requiere el número de documento (dip)' })
    }

    try {
      const persona = await db
        .from('public.personas')
        .where('dip', dip)
        .select('id_persona as idPersona', 'nombre_completo as nombreCompleto', 'dip', 'correo', 'celular')
        .first()

      if (!persona) {
        return response.notFound({ error: 'Persona no encontrada' })
      }

      return response.ok(persona)
    } catch (error) {
      console.error('[searchPersona Error]:', error)
      return response.internalServerError({ error: 'Error al buscar persona' })
    }
  }

  async listFacultades({ response }: HttpContext) {
    try {
      const list = await db
        .from('public.facultades')
        .where('id_estado', true)
        .whereLike('facultad', '%FACULTAD%')  // Excluir unidades admin (Rectorado, HCU, Postgrado, etc.)
        .select('id_facultad as idFacultad', 'facultad', 'abrev')
        .orderBy('facultad', 'asc')

      return response.ok(list)
    } catch (error) {
      console.error('[listFacultades Error]:', error)
      return response.internalServerError({ error: 'Error al obtener catálogo de facultades' })
    }
  }

  async createOperator({ request, response }: HttpContext) {
    const { idPersona, rol, idFacultad, password } = request.only([
      'idPersona',
      'rol',
      'idFacultad',
      'password'
    ])

    if (!idPersona || !rol) {
      return response.badRequest({ error: 'Faltan campos requeridos (idPersona, rol)' })
    }

    if (rol !== 'ADMINISTRADOR_APP' && rol !== 'OPERADOR_NOTIFICACIONES') {
      return response.badRequest({ error: 'Rol inválido' })
    }

    try {
      // 1. Obtener datos de la persona
      const persona = await db.from('public.personas').where('id_persona', idPersona).first()
      if (!persona) {
        return response.notFound({ error: 'Persona no encontrada en el catálogo general' })
      }

      // 2. Verificar o crear la cuenta de usuario en public._usuarios
      let user = await db.from('public._usuarios').where('id_persona', idPersona).first()
      let idUsuario

      if (!user) {
        // Encriptar la contraseña (si no se proporciona se usa su C.I.)
        const passText = password || persona.dip
        const passHash = await hash.use('bcrypt').make(passText)

        const maxUser = await db.from('public._usuarios').max('id_usuario as max_id').first()
        idUsuario = Number(maxUser?.max_id || 0) + 1

        await db.table('public._usuarios').insert({
          id_usuario: idUsuario,
          id_persona: idPersona,
          apodo: persona.dip,
          clave2: passHash,
          clave: 'legacy_md5_ignore',
          id_estado: true,
          recordatorio: 'AUTOMATICO_APP'
        })
      } else {
        idUsuario = user.id_usuario

        // Estructurar campos a actualizar
        const updateData: any = { id_estado: true }

        // Si el administrador ingresó una contraseña explícita en el modal, o si el usuario existente no tiene clave2 (clave moderna)
        if (password || !user.clave2) {
          const passText = password || persona.dip
          const passHash = await hash.use('bcrypt').make(passText)
          updateData.clave2 = passHash
        }

        // Asegurar que la cuenta de usuario esté activa y opcionalmente actualizar/inicializar la clave moderna (clave2)
        await db.from('public._usuarios').where('id_usuario', idUsuario).update(updateData)
      }

      // 3. Obtener el rol maestro del sistema
      const systemId = env.get('SYSTEM_ID') || 7
      const roleRecord = await db
        .from('public._roles')
        .where('rol', rol)
        .where('id_sistema', systemId)
        .first()

      if (!roleRecord) {
        return response.internalServerError({ error: `El rol ${rol} no está definido para el sistema ${systemId}` })
      }

      // 4. Asignar o reactivar el rol en public._usr_roles
      const existingRelation = await db
        .from('public._usr_roles')
        .where('id_usuario', idUsuario)
        .where('id_rol', roleRecord.id_rol)
        .first()

      if (existingRelation) {
        await db
          .from('public._usr_roles')
          .where('id_usr_rol', existingRelation.id_usr_rol)
          .update({ id_estado: true })
      } else {
        const maxUsrRol = await db.from('public._usr_roles').max('id_usr_rol as max_id').first()
        const nextUsrRolId = Number(maxUsrRol?.max_id || 0) + 1

        await db.table('public._usr_roles').insert({
          id_usr_rol: nextUsrRolId,
          id_usuario: idUsuario,
          id_rol: roleRecord.id_rol,
          id_estado: true
        })
      }

      // 5. Configurar restricción de facultad en public._usr_facultades
      // Desactivar cualquier facultad activa anterior para este usuario
      await db.from('public._usr_facultades').where('id_usuario', idUsuario).update({ id_estado: false })

      if (rol === 'OPERADOR_NOTIFICACIONES' && idFacultad) {
        const existingFaculty = await db
          .from('public._usr_facultades')
          .where('id_usuario', idUsuario)
          .where('id_facultad', idFacultad)
          .first()

        if (existingFaculty) {
          await db
            .from('public._usr_facultades')
            .where('id_usr_facultad', existingFaculty.id_usr_facultad)
            .update({ id_estado: true })
        } else {
          const maxUsrFac = await db.from('public._usr_facultades').max('id_usr_facultad as max_id').first()
          const nextUsrFacId = Number(maxUsrFac?.max_id || 0) + 1

          await db.table('public._usr_facultades').insert({
            id_usr_facultad: nextUsrFacId,
            id_usuario: idUsuario,
            id_facultad: idFacultad,
            id_estado: true
          })
        }
      }

      return response.ok({ success: true, message: 'Operador registrado correctamente' })
    } catch (error) {
      console.error('[createOperator Error]:', error)
      return response.internalServerError({ error: 'Error al registrar operador en la base de datos' })
    }
  }

  async toggleOperator({ params, request, response }: HttpContext) {
    const id = params.id
    const { activo } = request.only(['activo'])

    if (activo === undefined) {
      return response.badRequest({ error: 'Se requiere el estado activo (boolean)' })
    }

    try {
      await db
        .from('public._usr_roles')
        .where('id_usr_rol', id)
        .update({ id_estado: activo })

      return response.ok({ success: true, message: 'Estado del operador actualizado' })
    } catch (error) {
      console.error('[toggleOperator Error]:', error)
      return response.internalServerError({ error: 'Error al cambiar estado del operador' })
    }
  }
}
