import { CarnetSchema } from '#database/schema'
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Usuario from '#models/usuario'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'

export default class Carnet extends CarnetSchema {
  static table = 'public.app_registro'

  static accessTokens = DbAccessTokensProvider.forModel(Carnet, {
    table: 'public.app_tokens',
    type: 'opaque',
  })

  @column()
  declare deviceToken: string | null

  declare currentAccessToken?: AccessToken

  @belongsTo(() => Usuario, {
    foreignKey: 'activadoPor',
  })
  declare activadoPorUser: BelongsTo<typeof Usuario>

  get estaExpirado(): boolean {
    if (!this.expiraEn) {
      return false
    }
    return DateTime.now() > this.expiraEn
  }
}
