const mysql = require('mysql2/promise');

async function testModel() {
  const db = mysql.createPool({
    host: 'localhost',
    user: 'admin',
    password: 'password',
    database: 'ot_project_db',
    port: 3306,
  });

  try {
    const [rows] = await db.execute(
      'SELECT user_id, user_name, full_name, role, remove, update_time FROM users_data WHERE user_name = ? AND password = ? AND remove = 0',
      ['test2', '.....']
    );
    console.log('Query result:', rows);
  } catch (err) {
    console.error('Query error:', err);
  } finally {
    await db.end();
  }
}

testModel();
