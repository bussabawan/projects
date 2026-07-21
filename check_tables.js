const mysql = require('mysql2/promise');

async function checkTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    password: 'password',
    database: 'ot_project_db'
  });

  const [tables] = await connection.execute('SHOW TABLES');
  console.log('Tables:', tables);

  // Check columns for patient, exercises, photo
  try {
    const [t1] = await connection.execute('DESCRIBE patient_data');
    console.log('patient_data:', t1);
  } catch(e) {}
  
  try {
    const [t2] = await connection.execute('DESCRIBE Exercises_data');
    console.log('Exercises_data:', t2);
  } catch(e) {}
  
  try {
    const [t3] = await connection.execute('DESCRIBE Photo_data');
    console.log('Photo_data:', t3);
  } catch(e) {}

  await connection.end();
}

checkTables().catch(console.error);
