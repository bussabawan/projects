const mysql = require('mysql2/promise');
async function check() {
  const c = await mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    password: 'password',
    database: 'ot_project_db'
  });
  const [t1] = await c.execute("SHOW COLUMNS FROM matching_exercises_log");
  console.log(t1);
  c.end();
}
check();
