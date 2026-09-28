import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import Usuario from '#models/usuario'

export default class AdminGuard {
  async handle(ctx: HttpContext, next: NextFn) {
    // Authenticate the request using the default OAT guard (api)
    const user = (await ctx.auth.authenticateUsing(['api'])) as Usuario

    // Verify that the administrator account is active
    if (!user.activo) {
      return ctx.response.forbidden({ error: 'Tu cuenta de administrador está inactiva' })
    }

    return next()
  }
}
