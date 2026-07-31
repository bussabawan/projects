import mysql from 'mysql2/promise';

async function check() {
  const db = mysql.createPool({
    host: '127.0.0.1',
    user: 'admin',
    password: 'password',
    database: 'ot_project_db',
    port: 3306,
  });

  try {
    const [users] = await db.query('SELECT user_id, user_name, full_name, role FROM users_data LIMIT 10');
    console.log("Users:", users);
  } catch(e) {
    console.error(e);
  } finally {
    db.end();
  }
}
check();
