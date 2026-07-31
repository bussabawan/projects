import mysql from 'mysql2/promise';
import fs from 'fs';

function loadEnv() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  for (const line of envContent.split('\n')) {
    if (line.includes('=')) {
      const [key, ...rest] = line.split('=');
      const val = rest.join('=').trim().replace(/^"|"$/g, '');
      process.env[key.trim()] = val;
    }
  }
}

async function checkSchema() {
  loadEnv();
  try {
    const db = mysql.createPool({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: parseInt(process.env.MYSQL_PORT || '3306'),
    });

    const [tables] = await db.query('SHOW TABLES');
    const tableKey = `Tables_in_${process.env.MYSQL_DATABASE}`;
    
    console.log(`Database: ${process.env.MYSQL_DATABASE}`);
    
    for (const tableObj of tables as any[]) {
      const tableName = tableObj[tableKey];
      console.log(`\nTable: ${tableName}`);
      const [columns] = await db.query(`DESCRIBE ${tableName}`);
      for (const col of columns as any[]) {
        console.log(`  - ${col.Field} (${col.Type})`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchema();
