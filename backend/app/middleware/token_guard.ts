import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import Carnet from '#models/carnet'

export default class TokenGuard {
  async handle(ctx: HttpContext, next: NextFn) {
    // Authenticate the request using the 'estudiante' guard
    const carnet = (await ctx.auth.authenticateUsing(['estudiante'])) as Carnet

    // Verify that the student carnet is active
    if (carnet.estado !== 'activo') {
      return ctx.response.forbidden({ error: 'Tu carnet digital no se encuentra activo' })
    }

    // Verify that the student carnet has not expired
    if (carnet.estaExpirado) {
      return ctx.response.forbidden({ error: 'Tu carnet digital ha expirado y requiere ser reactivado en la DTIC' })
    }

    return next()
  }
}
