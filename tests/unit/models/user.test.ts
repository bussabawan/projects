import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserModel, User } from '@/lib/models/user';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { mockUsers } from '../../mocks/fixtures/users.fixture';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

vi.mock('@/lib/db', () => ({
  db: {
    query: vi.fn(),
    execute: vi.fn(),
    getConnection: vi.fn()
  }
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn()
  }
}));

describe('UserModel (Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findByUserName', () => {
    it('ควรค้นหาผู้ใช้จาก username และคืนค่า User เมื่อพบข้อมูล', async () => {
      const patient = mockUsers[1]; // patient01
      vi.mocked(db.execute).mockResolvedValueOnce([
        [patient as unknown as RowDataPacket],
        []
      ] as unknown as [RowDataPacket[], unknown]);

      const user = await UserModel.findByUserName('patient01');
      expect(user).toBeDefined();
      expect(user?.user_name).toBe('patient01');
      expect(user?.role).toBe(1);
    });

    it('ควรคืนค่า null เมื่อไม่พบผู้ใช้', async () => {
      vi.mocked(db.execute).mockResolvedValueOnce([[], []] as unknown as [RowDataPacket[], unknown]);
      const user = await UserModel.findByUserName('unknown');
      expect(user).toBeNull();
    });
  });

  describe('authenticate', () => {
    it('ควรคืนค่า errorType: NOT_FOUND เมื่อไม่พบชื่อผู้ใช้', async () => {
      vi.mocked(db.execute).mockResolvedValueOnce([[], []] as unknown as [RowDataPacket[], unknown]);

      const result = await UserModel.authenticate('nonexistent', 'pass123');
      expect(result.user).toBeNull();
      expect(result.errorType).toBe('NOT_FOUND');
    });

    it('ควรคืนค่า isLocked: true เมื่อโควตาล็อกอินผิดเกิน 10 ครั้ง', async () => {
      const lockedUser = {
        ...mockUsers[1],
        login_quota: 10,
        stored_password: '$2a$10$hashed'
      };
      vi.mocked(db.execute).mockResolvedValueOnce([
        [lockedUser as unknown as RowDataPacket],
        []
      ] as unknown as [RowDataPacket[], unknown]);

      const result = await UserModel.authenticate('patient01', 'pass123');
      expect(result.user).toBeNull();
      expect(result.isLocked).toBe(true);
      expect(result.errorType).toBe('LOCKED');
    });

    it('ควรเพิ่ม login_quota เมื่อรหัสผ่านไม่ถูกต้อง', async () => {
      const user = {
        ...mockUsers[1],
        login_quota: 2,
        stored_password: '$2a$10$hashed'
      };
      vi.mocked(db.execute)
        .mockResolvedValueOnce([[user as unknown as RowDataPacket], []] as unknown as [RowDataPacket[], unknown]) // findOne
        .mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []] as unknown as [ResultSetHeader, unknown]); // UPDATE login_quota

      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

      const result = await UserModel.authenticate('patient01', 'wrong_pass');
      expect(result.user).toBeNull();
      expect(result.errorType).toBe('WRONG_PASSWORD');
      expect(result.remainingAttempts).toBe(7); // 10 - (2 + 1)
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users_data SET login_quota = ? WHERE user_id = ?'),
        [3, user.user_id]
      );
    });

    it('ควรล็อกอินสำเร็จและรีเซ็ต login_quota เป็น 0 เมื่อรหัสผ่านถูกต้อง', async () => {
      const user = {
        ...mockUsers[1],
        login_quota: 3,
        stored_password: '$2a$10$hashed'
      };
      vi.mocked(db.execute)
        .mockResolvedValueOnce([[user as unknown as RowDataPacket], []] as unknown as [RowDataPacket[], unknown]) // findOne
        .mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []] as unknown as [ResultSetHeader, unknown]); // reset login_quota

      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

      const result = await UserModel.authenticate('patient01', 'correct_pass');
      expect(result.user).toBeDefined();
      expect((result.user as User).login_quota).toBe(0);
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users_data SET login_quota = 0 WHERE user_id = ?'),
        [user.user_id]
      );
    });

    it('ควรป้องกันการล็อกอินด้วย password สำหรับบัญชี Google staff', async () => {
      const googleStaff = {
        ...mockUsers[0],
        stored_password: 'API Login google'
      };
      vi.mocked(db.execute).mockResolvedValueOnce([
        [googleStaff as unknown as RowDataPacket],
        []
      ] as unknown as [RowDataPacket[], unknown]);

      const result = await UserModel.authenticate('admin', 'any_pass');
      expect(result.user).toBeNull();
      expect(result.errorType).toBe('STAFF_GOOGLE_ONLY');
    });
  });

  describe('logLogin & getAssignedExercises', () => {
    it('logLogin ควรบันทึกเวลาเข้าสู่ระบบลง login_logs', async () => {
      vi.mocked(db.execute).mockResolvedValueOnce([{ insertId: 1 } as ResultSetHeader, []] as unknown as [ResultSetHeader, unknown]);

      await UserModel.logLogin(10);
      expect(db.execute).toHaveBeenCalledWith(
        'INSERT INTO login_logs (user_id, login_time) VALUES (?, NOW())',
        [10]
      );
    });

    it('getAssignedExercises ควรดึงแบบฝึกหัดที่ผูกกับผู้ป่วย', async () => {
      const mockExercises = [
        { exercises_id: 1, exercises_name: 'แบบฝึกหัดสัตว์', thumbnail_id: 101 }
      ];
      vi.mocked(db.query).mockResolvedValueOnce([mockExercises as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown]);

      const exercises = await UserModel.getAssignedExercises('10');
      expect(exercises).toEqual(mockExercises);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM patient_data p'),
        ['10']
      );
    });
  });
});
