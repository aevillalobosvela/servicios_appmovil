import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Persona extends BaseModel {
  static table = 'public.personas'

  @column({ isPrimary: true, columnName: 'id_persona' })
  declare idPersona: number

  @column()
  declare nombres: string

  @column()
  declare paterno: string | null

  @column()
  declare materno: string | null

  @column({ columnName: 'nombre_completo' })
  declare nombreCompleto: string

  @column()
  declare dip: string

  @column()
  declare celular: string | null

  @column()
  declare correo: string | null
}
