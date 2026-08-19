import mysql from 'mysql2/promise';

const host = process.env.MYSQL_HOST === 'localhost' ? '127.0.0.1' : process.env.MYSQL_HOST;

export const db = mysql.createPool({
  host: host,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
