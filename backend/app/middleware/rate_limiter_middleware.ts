import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

interface RequestTracker {
  count: number
  resetTime: number
}

export default class RateLimiterMiddleware {
  // ⚠️  LIMITACIÓN CONOCIDA — Rate limiter en memoria de proceso
  //
  // Este limitador almacena el estado en un Map local al proceso Node.js.
  // Esto es intencional para este despliegue de contenedor único (no hay
  // múltiples réplicas) y evita introducir dependencias externas como Redis.
  //
  // Consecuencias a tener en cuenta:
  // 1. Al reiniciar el contenedor (deploy, crash, OOM) los contadores se
  //    resetean. Un atacante podría explotar la ventana de reinicio.
  // 2. Si en el futuro se escala a múltiples réplicas del contenedor, cada
  //    instancia tendrá su propio contador independiente, multiplicando el
  //    límite efectivo por el número de réplicas. En ese caso se debe
  //    migrar a un store centralizado (Redis + @adonisjs/limiter).
  //
  // Para el caso de uso actual (panel admin de una sola institución con
  // tráfico bajo-moderado) este enfoque es suficiente y sin overhead.
  private static trackers = new Map<string, RequestTracker>()

  // Configuración de límites: 30 peticiones por minuto por IP
  private limit = 30
  private windowMs = 60 * 1000 // 1 minuto

  async handle(ctx: HttpContext, next: NextFn) {
    const ip = ctx.request.ip()
    const now = Date.now()

    let tracker = RateLimiterMiddleware.trackers.get(ip)

    if (!tracker) {
      tracker = {
        count: 1,
        resetTime: now + this.windowMs,
      }
      RateLimiterMiddleware.trackers.set(ip, tracker)
    } else {
      if (now > tracker.resetTime) {
        tracker.count = 1
        tracker.resetTime = now + this.windowMs
      } else {
        tracker.count++
      }
    }

    // Agregar headers estándar de rate limiting
    const remaining = Math.max(0, this.limit - tracker.count)
    ctx.response.header('X-RateLimit-Limit', this.limit)
    ctx.response.header('X-RateLimit-Remaining', remaining)
    ctx.response.header('X-RateLimit-Reset', Math.ceil(tracker.resetTime / 1000))

    if (tracker.count > this.limit) {
      return ctx.response.tooManyRequests({
        error: 'Demasiadas solicitudes. Por favor, intenta de nuevo más tarde.',
      })
    }

    // Limpieza periódica para evitar fugas de memoria (cada 1000 entradas)
    if (RateLimiterMiddleware.trackers.size > 1000) {
      RateLimiterMiddleware.cleanTrackers(now)
    }

    return next()
  }

  private static cleanTrackers(now: number) {
    for (const [ip, tracker] of this.trackers.entries()) {
      if (now > tracker.resetTime) {
        this.trackers.delete(ip)
      }
    }
  }
}
