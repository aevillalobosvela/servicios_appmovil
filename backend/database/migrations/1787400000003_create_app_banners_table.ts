import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'app_banners'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('titulo', 150).nullable()
      table.string('imagen_path', 255).notNullable()
      table.string('enlace_redireccion', 255).nullable()
      table.boolean('activo').defaultTo(true).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.raw('now()'))
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
