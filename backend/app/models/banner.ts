import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Banner extends BaseModel {
  static table = 'public.app_banners'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare titulo: string | null

  @column()
  declare imagenPath: string

  @column()
  declare enlaceRedireccion: string | null

  @column()
  declare activo: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
