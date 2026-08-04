// eslint-disable-next-line @typescript-eslint/no-require-imports
const mysql = require('mysql2/promise');

async function run() {
  const db = mysql.createPool({
    host: 'localhost',
    user: 'admin',
    password: 'password',
    database: 'ot_project_db',
    port: 3306,
  });

  const [tables] = await db.execute('SHOW TABLES');
  console.log('Tables:');
  
  for (const t of tables) {
    const tableName = Object.values(t)[0];
    const [cols] = await db.execute(`SHOW COLUMNS FROM ${tableName}`);
    console.log(`\n--- Table ${tableName} ---`);
    for (const c of cols) {
      console.log(`${c.Field} (${c.Type})`);
    }
  }

  process.exit(0);
}

run().catch(console.error);
