import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'app_push_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('app_id', 50).notNullable()
      table.string('token', 255).notNullable().unique()
      table.string('perfil', 50).notNullable().defaultTo('todos')
      table.string('user_ci', 20).nullable()
      table.string('device_os', 20).nullable()
      table.boolean('activo').notNullable().defaultTo(true)
      table.specificType('roles', 'text[]').notNullable().defaultTo('{todos}')
      table.specificType('temas', 'text[]').notNullable().defaultTo('{}')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.raw('now()'))
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.raw('now()'))

      // Índices de rendimiento
      table.index(['app_id'], 'idx_app_push_tokens_app_id')
      table.index(['perfil'], 'idx_app_push_tokens_perfil')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
