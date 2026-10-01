import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  static disableTransactions = true

  async up() {
    // Índice compuesto (id_persona, estado): es la columna más consultada en todo
    // el sistema. Todas las subqueries del listado de carnets filtran por ambas
    // columnas simultáneamente. Sin este índice PostgreSQL hace seq scan sobre
    // app_registro por cada fila de personas que devuelve la query principal.
    this.schema.raw(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_app_registro_persona_estado
        ON public.app_registro (id_persona, estado)
    `)

    // Índice simple en id_persona para lookups directos por persona sin filtro
    // de estado (usado en AdminCarnetController.show y AuthEstudianteController).
    this.schema.raw(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_app_registro_id_persona
        ON public.app_registro (id_persona)
    `)
  }

  async down() {
    this.schema.raw(`DROP INDEX CONCURRENTLY IF EXISTS public.idx_app_registro_persona_estado`)
    this.schema.raw(`DROP INDEX CONCURRENTLY IF EXISTS public.idx_app_registro_id_persona`)
  }
}
