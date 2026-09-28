import crypto from 'node:crypto'
import env from '#start/env'

export default class QrVerificacionService {
  /**
   * Genera un token firmado para el QR de verificación horario
   */
  generar(estudianteId: string): string {
    const expiresAt = Date.now() + 60 * 60 * 1000 // 1 hora
    const dataToSign = `${estudianteId}:${expiresAt}`
    const signature = crypto
      .createHmac('sha256', env.get('APP_KEY').release())
      .update(dataToSign)
      .digest('hex')

    return `${dataToSign}:${signature}`
  }

  /**
   * Valida si el token QR corresponde al estudiante y sigue vigente
   */
  validar(token: string, estudianteId: string): boolean {
    try {
      const parts = token.split(':')
      if (parts.length !== 3) return false

      const [tokenEstudianteId, expiresAtStr, signature] = parts
      if (tokenEstudianteId !== estudianteId) return false

      const expiresAt = parseInt(expiresAtStr, 10)
      if (isNaN(expiresAt) || Date.now() > expiresAt) return false

      const dataToSign = `${tokenEstudianteId}:${expiresAtStr}`
      const expectedSignature = crypto
        .createHmac('sha256', env.get('APP_KEY').release())
        .update(dataToSign)
        .digest('hex')

      return signature === expectedSignature
    } catch {
      return false
    }
  }
}
