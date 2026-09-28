import db from '@adonisjs/lucid/services/db'

export default class ExpiracionService {
  /**
   * Busca carnets activos cuya fecha de expiración sea menor o igual a la actual
   * y los marca como 'expirados'.
   */
  async verificarExpiraciones(): Promise<number> {
    const rowsAffected = await db
      .from('public.app_registro')
      .where('estado', 'activo')
      .where('expira_en', '<=', db.raw('NOW()'))
      .update({ estado: 'expirado' })

    return rowsAffected as unknown as number
  }
}
