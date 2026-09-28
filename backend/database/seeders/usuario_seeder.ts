import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Usuario from '#models/usuario'
import Persona from '#models/persona'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import env from '#start/env'

export default class extends BaseSeeder {
  async run() {
    const systemId = env.get('SYSTEM_ID') || 7

    // 1. Asegurar el registro de id_sistema en public.sistemas
    const checkSistema = await db
      .from('public.sistemas')
      .where('id_sistema', systemId)
      .first()

    if (!checkSistema) {
      await db.table('public.sistemas').insert({
        id_sistema: systemId,
        sistema: 'SERVICIOS_MOVILES',
        descripcion: 'Servicios Móviles y Carnet Digital UTO',
      })
      console.log(`[Seeder] Sistema id_sistema = ${systemId} creado.`)
    }

    // 2. Asegurar el rol ADMINISTRADOR_APP para el sistema
    let adminRole = await db
      .from('public._roles')
      .where('rol', 'ADMINISTRADOR_APP')
      .where('id_sistema', systemId)
      .first()

    let idAdminRol: number
    if (!adminRole) {
      const maxRole = await db.from('public._roles').max('id_rol as maxId').first()
      idAdminRol = Number(maxRole?.maxId || 0) + 1
      await db.table('public._roles').insert({
        id_rol: idAdminRol,
        rol: 'ADMINISTRADOR_APP',
        descripcion: 'Administrador del sistema de notificaciones y banners',
        id_sistema: systemId,
        id_estado: true,
      })
      console.log(`[Seeder] Rol ADMINISTRADOR_APP creado con ID: ${idAdminRol} para sistema ${systemId}.`)
    } else {
      idAdminRol = adminRole.id_rol
    }

    // 3. Asegurar el rol OPERADOR_NOTIFICACIONES para el sistema
    const operatorRole = await db
      .from('public._roles')
      .where('rol', 'OPERADOR_NOTIFICACIONES')
      .where('id_sistema', systemId)
      .first()

    if (!operatorRole) {
      const maxRole = await db.from('public._roles').max('id_rol as maxId').first()
      const idOperatorRol = Number(maxRole?.maxId || 0) + 1
      await db.table('public._roles').insert({
        id_rol: idOperatorRol,
        rol: 'OPERADOR_NOTIFICACIONES',
        descripcion: 'Operador restringido para envío de notificaciones por facultad',
        id_sistema: systemId,
        id_estado: true,
      })
      console.log(`[Seeder] Rol OPERADOR_NOTIFICACIONES creado con ID: ${idOperatorRol} para sistema ${systemId}.`)
    }

    // 4. Definir credenciales iniciales (leyendo de variables de entorno o valores por defecto)
    const adminUser = process.env.INITIAL_ADMIN_USER || 'admin.dtic'
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'admin123'

    // 5. Verificar o crear el administrador inicial
    let user = await Usuario.query().where('usuario', adminUser).first()

    if (!user) {
      // Buscar la persona requerida para el administrador (CI 7419416)
      const persona = await Persona.query().where('dip', '7419416').first()
      const idPersona = persona ? persona.idPersona : 129088
      const adminName = persona ? persona.nombreCompleto : 'ALVARO EDWIN VILLALOBOS VELA'

      // Hashear la contraseña usando bcrypt
      const hashedPassword = await hash.use('bcrypt').make(adminPassword)

      user = await Usuario.create({
        idPersona: idPersona,
        usuario: adminUser,
        password: hashedPassword,
        clave: hashedPassword,
        activo: true,
      })
      console.log(`[Seeder] Usuario administrador inicial creado con éxito:`)
      console.log(`- Usuario: ${adminUser}`)
      console.log(`- Persona Asociada: ${adminName} (ID: ${idPersona})`)
      console.log(`- Clave: ${process.env.INITIAL_ADMIN_PASSWORD ? '***** (Configurada en .env)' : adminPassword}`)
    } else {
      console.log(`[Seeder] El usuario administrador '${adminUser}' ya existe.`)
    }

    // 6. Asignar el rol ADMINISTRADOR_APP al usuario administrador
    const checkUsrRol = await db
      .from('public._usr_roles')
      .where('id_usuario', user.id)
      .where('id_rol', idAdminRol)
      .first()

    if (!checkUsrRol) {
      const maxUsrRol = await db.from('public._usr_roles').max('id_usr_rol as maxId').first()
      const nextUsrRolId = Number(maxUsrRol?.maxId || 0) + 1
      await db.table('public._usr_roles').insert({
        id_usr_rol: nextUsrRolId,
        id_usuario: user.id,
        id_rol: idAdminRol,
        id_estado: true,
      })
      console.log(`[Seeder] Rol asignado correctamente al usuario administrador (Registro ID: ${nextUsrRolId}).`)
    } else {
      console.log(`[Seeder] El usuario administrador ya tiene asignado el rol ADMINISTRADOR_APP.`)
    }
  }
}
