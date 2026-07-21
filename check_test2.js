const mysql = require('mysql2/promise');

async function checkTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password'
  });

  try {
    const [dbs] = await connection.execute('SHOW DATABASES');
    console.log('Databases:', dbs);
    
    await connection.execute('USE test2');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Tables in test2:', tables);
  } catch (e) {
    console.error('Error:', e.message);
  }

  await connection.end();
}

checkTables().catch(console.error);
