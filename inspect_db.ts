import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function inspectDb() {
  const host = process.env.MYSQL_HOST === 'localhost' ? '127.0.0.1' : process.env.MYSQL_HOST;
  const db = mysql.createPool({
    host: host,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
  });

  try {
    console.log("Checking tables...");
    const [tables] = await db.query('SHOW TABLES');
    console.log(tables);
    
    console.log("Checking users_data...");
    const [users] = await db.query('DESCRIBE users_data');
    console.log(users);

    console.log("Checking patient_data...");
    const [patients] = await db.query('DESCRIBE patient_data');
    console.log(patients);

  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
}

inspectDb();
