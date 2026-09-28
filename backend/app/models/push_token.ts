import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class PushToken extends BaseModel {
  static table = 'public.app_push_tokens'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare appId: string

  @column()
  declare token: string

  @column()
  declare perfil: string

  @column()
  declare userCi: string | null

  @column()
  declare deviceOs: string | null

  @column()
  declare activo: boolean

  @column()
  declare roles: string[]

  @column()
  declare temas: string[]

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
