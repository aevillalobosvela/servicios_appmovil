import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export class CarnetSchema extends BaseModel {
  static $columns = ['activadoEn', 'activadoPor', 'estado', 'estudianteId', 'expiraEn', 'id', 'idPersona', 'updatedAt', 'idCarrera', 'idEstudianteAcademico', 'codigoVerificacion', 'codigoExpiraEn'] as const
  $columns = CarnetSchema.$columns

  @column.dateTime()
  declare activadoEn: DateTime | null

  @column()
  declare activadoPor: number | null

  @column()
  declare estado: string

  @column()
  declare estudianteId: string | null

  @column.dateTime()
  declare expiraEn: DateTime | null

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare idPersona: number

  @column()
  declare idCarrera: number | null

  @column()
  declare idEstudianteAcademico: number | null

  @column()
  declare codigoVerificacion: string | null

  @column.dateTime()
  declare codigoExpiraEn: DateTime | null

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

export class UsuarioSchema extends BaseModel {
  static $columns = ['activo', 'createdAt', 'id', 'nombre', 'password', 'updatedAt', 'usuario'] as const
  $columns = UsuarioSchema.$columns

  @column()
  declare activo: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nombre: string

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare usuario: string
}
