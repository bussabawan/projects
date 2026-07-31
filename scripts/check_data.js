const mysql = require('mysql2/promise');

async function run() {
  const db = mysql.createPool({
    host: 'localhost',
    user: 'admin',
    password: 'password',
    database: 'ot_project_db',
    port: 3306,
  });

  const [exercises] = await db.execute('SELECT * FROM exercises_data LIMIT 5');
  console.log('exercises_data:', exercises);

  const [matching] = await db.execute('SELECT * FROM matching_exercises_log LIMIT 5');
  console.log('matching_exercises_log:', matching);

  const [memory] = await db.execute('SELECT * FROM memory_exercises_log LIMIT 5');
  console.log('memory_exercises_log:', memory);

  process.exit(0);
}

run().catch(console.error);
