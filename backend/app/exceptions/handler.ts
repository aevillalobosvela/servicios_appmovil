import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof Error) {
      const msg = error.message || ''
      const code = (error as any).code || ''

      // Interceptar errores de base de datos o de timeout de conexión
      if (
        msg.includes('Timeout acquiring a connection') ||
        msg.includes('pool is probably full') ||
        code === 'ECONNREFUSED' ||
        code === 'ETIMEDOUT'
      ) {
        return ctx.response.status(503).send({
          error: 'El servidor de base de datos no se encuentra disponible o está temporalmente saturado. Por favor, intente de nuevo en unos momentos.'
        })
      }

      // Traducir error de credenciales incorrectas
      if (code === 'E_INVALID_CREDENTIALS' || msg.includes('Invalid user credentials')) {
        return ctx.response.status((error as any).status || 400).send({
          error: 'Usuario o contraseña incorrectos.'
        })
      }
    }
    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
