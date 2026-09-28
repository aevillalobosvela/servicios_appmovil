import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'app_registro'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('id_persona').notNullable()
      table.uuid('estudiante_id').nullable()
      table.string('estado', 20).notNullable().defaultTo('inactivo')
      table
        .integer('activado_por')
        .nullable()
        .unsigned()
        .references('id_usuario')
        .inTable('public._usuarios')
        .onDelete('SET NULL')
      table.timestamp('activado_en', { useTz: true }).nullable()
      table.timestamp('expira_en', { useTz: true }).nullable()
      table.text('device_token').nullable()
      table.integer('id_carrera').nullable()
      table.integer('id_estudiante_academico').nullable()
      table.string('codigo_verificacion', 10).nullable()
      table.timestamp('codigo_expira_en', { useTz: true }).nullable()
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.raw('now()'))

      // Restricción de unicidad compuesta
      table.unique(['id_persona', 'id_carrera'], 'uq_persona_carrera')

      // Índices de rendimiento
      table.index(['estudiante_id'], 'idx_app_registro_estudiante_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
