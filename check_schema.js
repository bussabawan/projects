const mysql = require('mysql2/promise');

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    password: 'password',
    database: 'ot_project_db'
  });

  const [rows] = await connection.execute('DESCRIBE users_data');
  console.log(rows);
  await connection.end();
}

checkSchema().catch(console.error);
