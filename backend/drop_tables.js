const { Client } = require('pg');

const client = new Client({
  host: '192.168.10.26',
  port: 5434,
  user: 'postgres',
  password: 'password', // Wait, password is 'YlhCNwCmRZ' in our .env!
  password: 'YlhCNwCmRZ',
  database: 'miuto_des20260817',
});

async function main() {
  await client.connect();
  console.log('Conectado a la base de datos de desarrollo.');

  const tablesToDrop = [
    'public.app_tokens',
    'public.app_banners',
    'public.app_push_tokens',
    'public.app_registro',
    'public.adonis_schema'
  ];

  for (const table of tablesToDrop) {
    try {
      console.log(`Eliminando tabla ${table}...`);
      await client.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
      console.log(`Tabla ${table} eliminada.`);
    } catch (e) {
      console.error(`Error al eliminar ${table}:`, e.message);
    }
  }

  await client.end();
  console.log('Desconectado.');
}

main().catch(console.error);
