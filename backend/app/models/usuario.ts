import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import Persona from '#models/persona'

const AuthFinder = withAuthFinder(hash, {
  uids: ['usuario'],
  passwordColumnName: 'clave2',
})

export default class Usuario extends compose(BaseModel, AuthFinder) {
  static table = 'public._usuarios'

  @column({ isPrimary: true, columnName: 'id_usuario' })
  declare id: number

  @column({ columnName: 'id_persona' })
  declare idPersona: number

  @column({ columnName: 'apodo' })
  declare usuario: string

  @column({ columnName: 'clave' })
  declare clave: string

  @column({ columnName: 'clave2', serializeAs: null })
  declare password: string // mapped to password for auth mixin

  @column({ columnName: 'recordatorio' })
  declare recordatorio: string | null

  @column({ columnName: 'id_estado' })
  declare activo: boolean

  @belongsTo(() => Persona, { foreignKey: 'idPersona' })
  declare persona: BelongsTo<typeof Persona>

  get nombre() {
    return this.persona ? this.persona.nombreCompleto : this.usuario
  }

  static accessTokens = DbAccessTokensProvider.forModel(Usuario, {
    table: 'public.app_tokens',
    type: 'opaque',
  })

  declare currentAccessToken?: AccessToken
}
