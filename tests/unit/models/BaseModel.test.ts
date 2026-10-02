import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseModel } from '@/lib/models/BaseModel';
import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

// Mock db
vi.mock('@/lib/db', () => ({
  db: {
    query: vi.fn(),
    execute: vi.fn(),
    getConnection: vi.fn()
  }
}));

// Test helper class to access protected methods of BaseModel
class TestModel extends BaseModel {
  static testQuery<T extends RowDataPacket>(sql: string, params?: unknown[]) {
    return this.query<T>(sql, params);
  }
  static testFindOne<T extends RowDataPacket>(sql: string, params?: unknown[]) {
    return this.findOne<T>(sql, params);
  }
  static testExecute(sql: string, params?: unknown[]) {
    return this.execute(sql, params);
  }
  static testInsert(table: string, data: Record<string, unknown>) {
    return this.insert(table, data);
  }
  static testUpdate(table: string, data: Record<string, unknown>, where: string, params: unknown[]) {
    return this.update(table, data, where, params);
  }
  static testDelete(table: string, where: string, params: unknown[]) {
    return this.delete(table, where, params);
  }
  static testTransaction<T>(cb: (conn: PoolConnection) => Promise<T>) {
    return this.transaction(cb);
  }
}

describe('BaseModel (Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('query & findOne', () => {
    it('query ควรคืนค่า array ของ rows', async () => {
      const mockRows = [{ id: 1, name: 'Item 1' }] as RowDataPacket[];
      vi.mocked(db.query).mockResolvedValueOnce([mockRows, []] as unknown as [RowDataPacket[], unknown]);

      const result = await TestModel.testQuery('SELECT * FROM test WHERE id = ?', [1]);
      expect(result).toEqual(mockRows);
      expect(db.query).toHaveBeenCalledWith('SELECT * FROM test WHERE id = ?', [1]);
    });

    it('findOne ควรคืนค่า row แรกเมื่อพบข้อมูล', async () => {
      const mockRows = [{ id: 1, name: 'Item 1' }] as RowDataPacket[];
      vi.mocked(db.execute).mockResolvedValueOnce([mockRows, []] as unknown as [RowDataPacket[], unknown]);

      const result = await TestModel.testFindOne('SELECT * FROM test WHERE id = ?', [1]);
      expect(result).toEqual(mockRows[0]);
    });

    it('findOne ควรคืนค่า null เมื่อไม่พบข้อมูล', async () => {
      vi.mocked(db.execute).mockResolvedValueOnce([[], []] as unknown as [RowDataPacket[], unknown]);

      const result = await TestModel.testFindOne('SELECT * FROM test WHERE id = ?', [999]);
      expect(result).toBeNull();
    });
  });

  describe('execute, insert, update, delete', () => {
    it('insert ควรสร้างคำสั่ง SQL INSERT และคืนค่า insertId', async () => {
      const mockHeader = { insertId: 42, affectedRows: 1 } as ResultSetHeader;
      vi.mocked(db.execute).mockResolvedValueOnce([mockHeader, []] as unknown as [ResultSetHeader, unknown]);

      const insertId = await TestModel.testInsert('category_data', {
        category_name: 'ผลไม้',
        remove: 0
      });

      expect(insertId).toBe(42);
      expect(db.execute).toHaveBeenCalledWith(
        'INSERT INTO category_data (category_name, remove) VALUES (?, ?)',
        ['ผลไม้', 0]
      );
    });

    it('update ควรสร้างคำสั่ง SQL UPDATE และคืนค่า affectedRows', async () => {
      const mockHeader = { affectedRows: 1 } as ResultSetHeader;
      vi.mocked(db.execute).mockResolvedValueOnce([mockHeader, []] as unknown as [ResultSetHeader, unknown]);

      const affected = await TestModel.testUpdate(
        'category_data',
        { category_name: 'ผลไม้เมืองหนาว' },
        'category_id = ?',
        [1]
      );

      expect(affected).toBe(1);
      expect(db.execute).toHaveBeenCalledWith(
        'UPDATE category_data SET category_name = ? WHERE category_id = ?',
        ['ผลไม้เมืองหนาว', 1]
      );
    });

    it('delete ควรสร้างคำสั่ง SQL DELETE และคืนค่า affectedRows', async () => {
      const mockHeader = { affectedRows: 1 } as ResultSetHeader;
      vi.mocked(db.execute).mockResolvedValueOnce([mockHeader, []] as unknown as [ResultSetHeader, unknown]);

      const affected = await TestModel.testDelete('category_data', 'category_id = ?', [1]);
      expect(affected).toBe(1);
      expect(db.execute).toHaveBeenCalledWith(
        'DELETE FROM category_data WHERE category_id = ?',
        [1]
      );
    });
  });

  describe('transaction', () => {
    it('ควร commit transaction เมื่อ callback สำเร็จ', async () => {
      const mockConnection = {
        beginTransaction: vi.fn().mockResolvedValue(undefined),
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
        release: vi.fn().mockResolvedValue(undefined)
      } as unknown as PoolConnection;

      vi.mocked(db.getConnection).mockResolvedValueOnce(mockConnection);

      const result = await TestModel.testTransaction(async () => {
        return 'success';
      });

      expect(result).toBe('success');
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.rollback).not.toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('ควร rollback transaction และ release connection เมื่อเกิด error', async () => {
      const mockConnection = {
        beginTransaction: vi.fn().mockResolvedValue(undefined),
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
        release: vi.fn().mockResolvedValue(undefined)
      } as unknown as PoolConnection;

      vi.mocked(db.getConnection).mockResolvedValueOnce(mockConnection);

      await expect(
        TestModel.testTransaction(async () => {
          throw new Error('Transaction failed');
        })
      ).rejects.toThrow('Transaction failed');

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });
});
