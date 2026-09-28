import Usuario from '#models/usuario'
import type { HttpContext } from '@adonisjs/core/http'
import { loginValidator } from '#validators/auth'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import env from '#start/env'

export default class AuthPanelController {
  async login({ request, response }: HttpContext) {
    const { usuario, password } = await request.validateUsing(loginValidator)

    try {
      // 1. Buscar usuario por apodo e id_estado (activo)
      const user = await Usuario.query()
        .where('apodo', usuario)
        .where('id_estado', true)
        .preload('persona')
        .first()

      if (!user) {
        return response.forbidden({ error: 'Credenciales inválidas o cuenta inactiva' })
      }

      // 2. Verificar contraseña contra clave2 (Bcrypt)
      const isPasswordValid = await hash.use('bcrypt').verify(user.password, password)
      if (!isPasswordValid) {
        return response.forbidden({ error: 'Credenciales inválidas' })
      }

      // 3. Validar si el usuario posee un rol asignado al sistema APP_MOVIL (ID: 7)
      const roles = await db
        .from('public._usr_roles as ur')
        .join('public._roles as r', 'ur.id_rol', 'r.id_rol')
        .where('ur.id_usuario', user.id)
        .where('r.id_sistema', env.get('SYSTEM_ID') || 7)
        .where('ur.id_estado', true)
        .where('r.id_estado', true)
        .select('r.rol')

      if (roles.length === 0) {
        return response.forbidden({ error: 'No tienes un rol activo para acceder a esta aplicación' })
      }

      // 4. Obtener si tiene restricciones de facultad asignadas
      const facultyRes = await db
        .from('public._usr_facultades')
        .where('id_usuario', user.id)
        .where('id_estado', true)
        .select('id_facultad')
        .first()

      const idFacultad = facultyRes ? facultyRes.id_facultad : null

      // 5. Emitir token de acceso opaco
      const token = await Usuario.accessTokens.create(user, ['*'], {
        expiresIn: '8 hours',
      })

      return {
        user: {
          id: user.id,
          usuario: user.usuario,
          nombre: user.nombre,
          rol: roles[0].rol,
          idFacultad,
        },
        token: token.value!.release(),
      }
    } catch (error) {
      console.error('[Login Error]:', error)
      return response.internalServerError({ error: 'Error al procesar el inicio de sesión' })
    }
  }

  async logout({ auth }: HttpContext) {
    const user = auth.use('api').getUserOrFail()

    if (user.currentAccessToken) {
      await Usuario.accessTokens.delete(user, user.currentAccessToken.identifier)
    }

    return {
      message: 'Sesión cerrada correctamente',
    }
  }
}
