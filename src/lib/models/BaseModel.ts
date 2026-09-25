import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

/**
 * Base Model providing common database operations
 */
export class BaseModel {
  /**
   * Execute a query that returns rows (SELECT)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected static async query<T extends RowDataPacket>(sql: string, params?: any[]): Promise<T[]> {
    try {
      const [rows] = await db.query<T[]>(sql, params);
      return rows;
    } catch (error) {
      console.error(`Database Query Error in ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Execute a query that returns a single row (SELECT ... LIMIT 1)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected static async findOne<T extends RowDataPacket>(sql: string, params?: any[]): Promise<T | null> {
    try {
      const [rows] = await db.execute<T[]>(sql, params);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`Database FindOne Error in ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Execute an operation that modifies data (INSERT, UPDATE, DELETE)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected static async execute(sql: string, params?: any[]): Promise<ResultSetHeader> {
    try {
      const [result] = await db.execute<ResultSetHeader>(sql, params);
      return result;
    } catch (error) {
      console.error(`Database Execute Error in ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Helper: Insert a new record into a table
   * @param table The table name
   * @param data Object containing column-value pairs
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected static async insert(table: string, data: Record<string, any>): Promise<number> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    const result = await this.execute(sql, values);
    return result.insertId;
  }

  /**
   * Helper: Update records in a table
   * @param table The table name
   * @param data Object containing column-value pairs to update
   * @param whereCondition The WHERE clause condition (e.g., "id = ?")
   * @param whereParams Parameters for the WHERE clause
   */
  protected static async update(
    table: string, 
    data: Record<string, unknown>, 
    whereCondition: string, 
    whereParams: unknown[]
  ): Promise<number> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereCondition}`;
    const result = await this.execute(sql, [...values, ...whereParams]);
    return result.affectedRows;
  }

  /**
   * Helper: Delete (or soft delete) records in a table
   * @param table The table name
   * @param whereCondition The WHERE clause condition
   * @param whereParams Parameters for the WHERE clause
   */
  protected static async delete(
    table: string, 
    whereCondition: string, 
    whereParams: unknown[]
  ): Promise<number> {
    const sql = `DELETE FROM ${table} WHERE ${whereCondition}`;
    const result = await this.execute(sql, whereParams);
    return result.affectedRows;
  }

  /**
   * Run a set of operations within a transaction
   */
  protected static async transaction<T>(callback: (connection: PoolConnection) => Promise<T>): Promise<T> {
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      console.error(`Transaction Error in ${this.name}:`, error);
      throw error;
    } finally {
      connection.release();
    }
  }
}
