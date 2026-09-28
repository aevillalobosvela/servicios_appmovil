import db from '@adonisjs/lucid/services/db'
import Carnet from '#models/carnet'
import { DateTime } from 'luxon'

export default class CodigoVerificacionService {
  /**
   * Genera un código alfanumérico aleatorio de 5 dígitos para el estudiante y lo persiste en la BD
   */
  async generar(carnetId: string): Promise<string> {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ' // Excluye caracteres ambiguos
    let codigo = ''
    for (let i = 0; i < 5; i++) {
      codigo += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const expiraEn = DateTime.now().plus({ minutes: 10 })

    // Buscar el carnet por su ID primario y persistir el código temporal
    const carnet = await Carnet.find(Number(carnetId))
    if (carnet) {
      carnet.codigoVerificacion = codigo
      carnet.codigoExpiraEn = expiraEn
      await carnet.save()
    }

    return codigo
  }

  /**
   * Valida el código enviado contra el almacenado en la BD y lo invalida (un solo uso)
   */
  async validar(codigo: string, carnetId: string): Promise<boolean> {
    const trx = await db.transaction()

    try {
      const carnet = await Carnet.query({ client: trx })
        .where('id', Number(carnetId))
        .where('codigoVerificacion', codigo.toUpperCase())
        .forUpdate()
        .first()

      if (!carnet) {
        await trx.rollback()
        return false
      }

      // Respaldar la fecha de expiración antes de limpiarla
      const expiraEn = carnet.codigoExpiraEn

      // Limpiar el código para que sea de un solo uso
      carnet.useTransaction(trx)
      carnet.codigoVerificacion = null
      carnet.codigoExpiraEn = null
      await carnet.save()

      // Confirmar transacción
      await trx.commit()

      // Validar tiempo de expiración usando la fecha respaldada
      if (!expiraEn || DateTime.now().toMillis() > expiraEn.toMillis()) {
        return false
      }

      return true
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
}
