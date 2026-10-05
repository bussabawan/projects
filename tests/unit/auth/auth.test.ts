import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authOptions, CustomAuthError, authorizeUser } from '@/auth';
import { UserModel } from '@/lib/models/user';

vi.mock('@/lib/models/user', () => ({
  UserModel: {
    authenticate: vi.fn(),
    findByUserName: vi.fn(),
    logLogin: vi.fn(),
  },
}));

describe('auth.ts (Core Authentication Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const signInCallback = authOptions.callbacks?.signIn as (params: {
    user: { id?: string; name?: string; email?: string | null };
    account: { provider: string } | null;
  }) => Promise<boolean>;

  const jwtCallback = authOptions.callbacks?.jwt as (params: {
    token: Record<string, unknown>;
    user?: Record<string, unknown>;
    account?: { provider: string } | null;
  }) => Promise<Record<string, unknown>>;

  describe('CredentialsProvider: authorizeUser()', () => {
    it('ควรโยน EMPTY_CREDENTIALS เมื่อไม่มี username หรือ password', async () => {
      await expect(
        authorizeUser({ username: '', password: '' })
      ).rejects.toThrowError(CustomAuthError);

      await expect(
        authorizeUser({ username: 'user1' })
      ).rejects.toThrowError(CustomAuthError);

      await expect(
        authorizeUser(null)
      ).rejects.toThrowError(CustomAuthError);
    });

    it('ควรโยน LOCKED_MAX_ATTEMPTS เมื่อบัญชีถูกระงับ (isLocked หรือ errorType LOCKED)', async () => {
      vi.mocked(UserModel.authenticate).mockResolvedValueOnce({
        isLocked: true,
        user: null,
      });

      await expect(
        authorizeUser({ username: 'user1', password: 'pwd' })
      ).rejects.toThrow('LOCKED_MAX_ATTEMPTS');
    });

    it('ควรโยน STAFF_GOOGLE_ONLY เมื่อ UserModel คืนค่า errorType STAFF_GOOGLE_ONLY', async () => {
      vi.mocked(UserModel.authenticate).mockResolvedValueOnce({
        user: null,
        errorType: 'STAFF_GOOGLE_ONLY',
      });

      await expect(
        authorizeUser({ username: 'staff1', password: 'pwd' })
      ).rejects.toThrow('STAFF_GOOGLE_ONLY');
    });

    it('ควรโยน REMAINING_X เมื่อรหัสผ่านผิดและมีจำนวนครั้งที่เหลือ', async () => {
      vi.mocked(UserModel.authenticate).mockResolvedValueOnce({
        user: null,
        remainingAttempts: 4,
      });

      await expect(
        authorizeUser({ username: 'user1', password: 'wrong' })
      ).rejects.toThrow('REMAINING_4');
    });

    it('ควรโยน STAFF_GOOGLE_ONLY หากผู้ใช้ที่ล็อกอินสำเร็จมี role = 2 (Staff)', async () => {
      vi.mocked(UserModel.authenticate).mockResolvedValueOnce({
        user: {
          user_id: 1,
          user_name: 'admin@hospital.com',
          full_name: 'Admin User',
          role: 2,
        },
      });

      await expect(
        authorizeUser({ username: 'admin@hospital.com', password: 'pwd' })
      ).rejects.toThrow('STAFF_GOOGLE_ONLY');
    });

    it('ควรคืนค่าข้อมูลผู้ป่วยเมื่อล็อกอินสำเร็จ (role = 1)', async () => {
      vi.mocked(UserModel.authenticate).mockResolvedValueOnce({
        user: {
          user_id: 10,
          user_name: 'patient01',
          full_name: 'สมชาย ใจดี',
          role: 1,
        },
      });

      const result = await authorizeUser({
        username: 'patient01',
        password: 'correct-password',
      });

      expect(result).toEqual({
        id: '10',
        name: 'สมชาย ใจดี',
        email: 'patient01',
        role: 1,
        fullName: 'สมชาย ใจดี',
      });
    });

    it('ควรโยน error คุณไม่มีสิทธิ์เข้าใช้งานระบบ หากผู้ใช้มี role อื่นนอกเหนือจาก 1', async () => {
      vi.mocked(UserModel.authenticate).mockResolvedValueOnce({
        user: {
          user_id: 99,
          user_name: 'unknown',
          full_name: 'Unknown',
          role: 99,
        },
      });

      await expect(
        authorizeUser({ username: 'unknown', password: 'pwd' })
      ).rejects.toThrow('คุณไม่มีสิทธิ์เข้าใช้งานระบบ');
    });

    it('ควรโยน CustomAuthError เมื่อเกิดข้อผิดพลาดไม่คาดคิดใน UserModel.authenticate', async () => {
      vi.mocked(UserModel.authenticate).mockRejectedValueOnce(new Error('DB Connection Timeout'));

      await expect(
        authorizeUser({ username: 'user', password: 'pwd' })
      ).rejects.toThrow('DB Connection Timeout');
    });
  });

  describe('callbacks: signIn()', () => {
    it('Google Sign-in: ควรคืนค่า false เมื่อไม่มี email', async () => {
      const result = await signInCallback({
        user: { email: null },
        account: { provider: 'google' },
      });
      expect(result).toBe(false);
    });

    it('Google Sign-in: ควรคืนค่า false เมื่อไม่พบบัญชีผู้ใช้ในระบบ', async () => {
      vi.mocked(UserModel.findByUserName).mockResolvedValueOnce(null);

      const result = await signInCallback({
        user: { email: 'unknown@gmail.com' },
        account: { provider: 'google' },
      });

      expect(result).toBe(false);
    });

    it('Google Sign-in: ควรคืนค่า true และบันทึกประวัติการล็อกอินเมื่อพบบัญชี role 2 (Admin/Staff)', async () => {
      vi.mocked(UserModel.findByUserName).mockResolvedValueOnce({
        user_id: 2,
        user_name: 'doctor@hospital.com',
        full_name: 'หมอ สมหมาย',
        role: 2,
      });

      const result = await signInCallback({
        user: { email: 'doctor@hospital.com' },
        account: { provider: 'google' },
      });

      expect(result).toBe(true);
      expect(UserModel.logLogin).toHaveBeenCalledWith(2);
    });

    it('Google Sign-in: ควรคืนค่า false หากผู้ใช้มี role อื่นนอกเหนือจาก 1 หรือ 2', async () => {
      vi.mocked(UserModel.findByUserName).mockResolvedValueOnce({
        user_id: 5,
        user_name: 'guest@hospital.com',
        full_name: 'Guest User',
        role: 0,
      });

      const result = await signInCallback({
        user: { email: 'guest@hospital.com' },
        account: { provider: 'google' },
      });

      expect(result).toBe(false);
      expect(UserModel.logLogin).not.toHaveBeenCalled();
    });

    it('Google Sign-in: ควรคืนค่า false เมื่อฐานข้อมูลเกิดข้อผิดพลาด', async () => {
      vi.mocked(UserModel.findByUserName).mockRejectedValueOnce(new Error('DB Query Error'));

      const result = await signInCallback({
        user: { email: 'doctor@hospital.com' },
        account: { provider: 'google' },
      });

      expect(result).toBe(false);
    });

    it('Credentials Sign-in: ควรบันทึกประวัติการล็อกอินและคืนค่า true', async () => {
      const result = await signInCallback({
        user: { id: '10', name: 'สมชาย ใจดี' },
        account: { provider: 'credentials' },
      });

      expect(result).toBe(true);
      expect(UserModel.logLogin).toHaveBeenCalledWith(10);
    });
  });

  describe('callbacks: jwt()', () => {
    it('Credentials Login: ควรแนบ role, fullName, และ id ลงใน token', async () => {
      const token = {};
      const user = {
        id: '15',
        role: 1,
        fullName: 'สมหญิง รักดี',
      };
      const account = { provider: 'credentials' };

      const result = await jwtCallback({ token, user, account });
      expect(result.id).toBe('15');
      expect(result.role).toBe(1);
      expect(result.fullName).toBe('สมหญิง รักดี');
      expect(result.exp).toBeUndefined();
    });

    it('Google Login: ควรดึง role, fullName, และ id จาก UserModel มาใส่ใน token', async () => {
      vi.mocked(UserModel.findByUserName).mockResolvedValueOnce({
        user_id: 3,
        user_name: 'therapist@hospital.com',
        full_name: 'นักกิจกรรมบำบัด',
        role: 2,
      });

      const token = {};
      const user = { email: 'therapist@hospital.com' };
      const account = { provider: 'google' };

      const result = await jwtCallback({ token, user, account });
      expect(result.id).toBe('3');
      expect(result.role).toBe(2);
      expect(result.fullName).toBe('นักกิจกรรมบำบัด');
      expect(typeof result.exp).toBe('number');
    });

    it('Staff (Role 2) Initial Login: ควรกำหนดเวลาหมดอายุ token ล่วงหน้า 1 ชั่วโมง (3600 วิ)', async () => {
      const nowSeconds = 1700000000;
      vi.spyOn(Date, 'now').mockReturnValue(nowSeconds * 1000);

      const token = {};
      const user = { id: '1', role: 2, fullName: 'Super Admin' };
      const account = { provider: 'credentials' };

      const result = await jwtCallback({ token, user, account });
      expect(result.exp).toBe(nowSeconds + 3600);

      vi.restoreAllMocks();
    });

    it('Staff Rolling Session: ควรขยายอายุ token อีก 1 ชั่วโมงเมื่อเวลาเหลือน้อยกว่า 30 นาที', async () => {
      const nowSeconds = 1700000000;
      vi.spyOn(Date, 'now').mockReturnValue(nowSeconds * 1000);

      const token = {
        id: '1',
        role: 2,
        exp: nowSeconds + 600,
      };

      const result = await jwtCallback({ token });
      expect(result.exp).toBe(nowSeconds + 3600);

      vi.restoreAllMocks();
    });

    it('Staff Rolling Session: ไม่ควรขยายอายุ token หากเวลาเหลือมากกว่า 30 นาที', async () => {
      const nowSeconds = 1700000000;
      vi.spyOn(Date, 'now').mockReturnValue(nowSeconds * 1000);

      const token = {
        id: '1',
        role: 2,
        exp: nowSeconds + 2700,
      };

      const result = await jwtCallback({ token });
      expect(result.exp).toBe(nowSeconds + 2700);

      vi.restoreAllMocks();
    });
  });
});
