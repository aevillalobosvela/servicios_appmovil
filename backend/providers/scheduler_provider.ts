import { ApplicationService } from '@adonisjs/core/types'
import ExpiracionService from '../app/services/expiracion_service.js'

export default class SchedulerProvider {
  constructor(protected app: ApplicationService) {}

  private intervalId: NodeJS.Timeout | null = null
  private expiracionService = new ExpiracionService()

  /**
   * El método ready se ejecuta cuando la aplicación ya está levantada y escuchando peticiones
   */
  async ready() {
    // No ejecutar en modo test para no colgar los hilos de prueba
    if (this.app.inTest) {
      return
    }

    // Ejecutar una validación inicial al arrancar el servidor
    this.ejecutarJob()

    // Configurar intervalo para ejecutarse cada 12 horas
    const doceHoras = 12 * 60 * 60 * 1000
    this.intervalId = setInterval(() => {
      this.ejecutarJob()
    }, doceHoras)
  }

  /**
   * Cancela el intervalo cuando el servidor se apaga
   */
  async shutdown() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
  }

  private async ejecutarJob() {
    try {
      const rows = await this.expiracionService.verificarExpiraciones()
      if (rows > 0) {
        console.log(`[Scheduler] Se han marcado ${rows} carnets como expirados automáticamente.`)
      }
    } catch (error) {
      console.error('[Scheduler] Error al procesar la expiración automática de carnets:', error)
    }
  }
}
