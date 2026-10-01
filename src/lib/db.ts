import mysql from 'mysql2/promise';

const host = process.env.MYSQL_HOST === 'localhost' ? '127.0.0.1' : process.env.MYSQL_HOST;

class DatabaseFactory {
  private static pool: mysql.Pool;

  public static getPool(): mysql.Pool {
    if (!DatabaseFactory.pool) {
      DatabaseFactory.pool = mysql.createPool({
        host: host,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      console.log('✅ Database Connection Pool initialized.');
    }
    return DatabaseFactory.pool;
  }

  public static async getConnection(): Promise<mysql.PoolConnection> {
    return await DatabaseFactory.getPool().getConnection();
  }
}

// Export a singleton instance of the pool for backward compatibility 
// with older code that hasn't been refactored yet.
export const db = DatabaseFactory.getPool();
