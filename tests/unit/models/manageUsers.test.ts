import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManageUsersModel } from '@/lib/models/manageUsers';
import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

vi.mock('@/lib/db', () => ({
  db: {
    query: vi.fn(),
    execute: vi.fn(),
    getConnection: vi.fn()
  }
}));

vi.mock('bcryptjs', () => ({
  default: {
    genSalt: vi.fn().mockResolvedValue('salt'),
    hash: vi.fn().mockResolvedValue('$2a$10$hashedpassword')
  }
}));

describe('ManageUsersModel (Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUsers', () => {
    it('ควรดึงรายการผู้ใช้ตามบทบาทและจำนวนรวม', async () => {
      const mockUsersList = [
        { user_id: 10, user_name: 'patient01', full_name: 'สมชาย', role: 1, login_quota: 0 }
      ] as unknown as RowDataPacket[];

      vi.mocked(db.query)
        .mockResolvedValueOnce([mockUsersList, []] as unknown as [RowDataPacket[], unknown]) // baseQuery
        .mockResolvedValueOnce([[{ total: 1 }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown]); // countQuery

      const result = await ManageUsersModel.getUsers(1, '', 1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('createUser', () => {
    it('ควรโยน Error เมื่อมี username ซ้ำในระบบ (remove = 0)', async () => {
      const mockConnection = {
        beginTransaction: vi.fn().mockResolvedValue(undefined),
        execute: vi.fn().mockResolvedValueOnce([[{ user_id: 1 }] as RowDataPacket[], []]),
        rollback: vi.fn().mockResolvedValue(undefined),
        release: vi.fn().mockResolvedValue(undefined)
      } as unknown as PoolConnection;

      vi.mocked(db.getConnection).mockResolvedValueOnce(mockConnection);

      await expect(
        ManageUsersModel.createUser({
          user_name: 'existing_user',
          full_name: 'ทดสอบ',
          role: 1
        })
      ).rejects.toThrow('Username already exists');

      expect(mockConnection.rollback).toHaveBeenCalled();
    });

    it('ควรโยน Error RESTORE_REQUIRED เมื่อผู้ใช้เคยถูก soft delete ไปแล้ว (remove = 1)', async () => {
      const mockConnection = {
        beginTransaction: vi.fn().mockResolvedValue(undefined),
        execute: vi.fn()
          .mockResolvedValueOnce([[], []]) // no active user
          .mockResolvedValueOnce([[{ user_id: 99 }] as RowDataPacket[], []]), // found in removed
        rollback: vi.fn().mockResolvedValue(undefined),
        release: vi.fn().mockResolvedValue(undefined)
      } as unknown as PoolConnection;

      vi.mocked(db.getConnection).mockResolvedValueOnce(mockConnection);

      await expect(
        ManageUsersModel.createUser({
          user_name: 'deleted_user',
          full_name: 'ทดสอบ',
          role: 1
        })
      ).rejects.toThrow('RESTORE_REQUIRED:99');

      expect(mockConnection.rollback).toHaveBeenCalled();
    });

    it('ควรสร้างผู้ป่วยสำเร็จพร้อมบันทึก patient_data และคืนค่า userId', async () => {
      const mockConnection = {
        beginTransaction: vi.fn().mockResolvedValue(undefined),
        execute: vi.fn()
          .mockResolvedValueOnce([[], []]) // no active user
          .mockResolvedValueOnce([[], []]) // no removed user
          .mockResolvedValueOnce([{ insertId: 101 } as ResultSetHeader, []]) // insert users_data
          .mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []]), // insert patient_data
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
        release: vi.fn().mockResolvedValue(undefined)
      } as unknown as PoolConnection;

      vi.mocked(db.getConnection).mockResolvedValueOnce(mockConnection);

      const userId = await ManageUsersModel.createUser({
        user_name: 'new_patient',
        full_name: 'ผู้ป่วยใหม่',
        role: 1,
        exercises_id: [1]
      });

      expect(userId).toBe(101);
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('deleteUser & restoreUser (Soft Delete)', () => {
    it('deleteUser ควรอัปเดต remove = 1 ทั้ง users_data และ patient_data', async () => {
      const mockConnection = {
        beginTransaction: vi.fn().mockResolvedValue(undefined),
        execute: vi.fn()
          .mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []]) // update users_data
          .mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []]), // update patient_data
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
        release: vi.fn().mockResolvedValue(undefined)
      } as unknown as PoolConnection;

      vi.mocked(db.getConnection).mockResolvedValueOnce(mockConnection);

      const result = await ManageUsersModel.deleteUser(10);
      expect(result).toBe(true);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'UPDATE users_data SET remove = 1 WHERE user_id = ?',
        [10]
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'UPDATE patient_data SET remove = 1 WHERE user_id = ?',
        [10]
      );
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    it('restoreUser ควรอัปเดต remove = 0 ทั้ง users_data และ patient_data', async () => {
      const mockConnection = {
        beginTransaction: vi.fn().mockResolvedValue(undefined),
        execute: vi.fn()
          .mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []]) // update users_data
          .mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []]), // update patient_data
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
        release: vi.fn().mockResolvedValue(undefined)
      } as unknown as PoolConnection;

      vi.mocked(db.getConnection).mockResolvedValueOnce(mockConnection);

      const result = await ManageUsersModel.restoreUser(10);
      expect(result).toBe(true);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'UPDATE users_data SET remove = 0 WHERE user_id = ?',
        [10]
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'UPDATE patient_data SET remove = 0 WHERE user_id = ?',
        [10]
      );
      expect(mockConnection.commit).toHaveBeenCalled();
    });
  });
});
