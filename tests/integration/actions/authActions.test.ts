import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkUserLoginQuota } from '@/app/actions/authActions';
import { UserModel } from '@/lib/models/user';

vi.mock('@/lib/models/user', () => ({
  UserModel: {
    getLoginQuota: vi.fn()
  }
}));

describe('authActions (Server Actions Integration Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkUserLoginQuota', () => {
    it('ควรคืนค่า default เมื่อ userName เป็นค่าว่าง', async () => {
      const result = await checkUserLoginQuota('');
      expect(result).toEqual({ loginQuota: 0, isLocked: false, remaining: 10 });
      expect(UserModel.getLoginQuota).not.toHaveBeenCalled();
    });

    it('ควรคืนค่า default เมื่อไม่พบผู้ใช้ในระบบ', async () => {
      vi.mocked(UserModel.getLoginQuota).mockResolvedValueOnce(null);

      const result = await checkUserLoginQuota('unknown_user');
      expect(result).toEqual({ loginQuota: 0, isLocked: false, remaining: 10 });
    });

    it('ควรคืนค่า loginQuota และ remaining ที่ถูกต้องเมื่อผู้ใช้ยังมีสิทธิ์ล็อกอิน', async () => {
      vi.mocked(UserModel.getLoginQuota).mockResolvedValueOnce(3);

      const result = await checkUserLoginQuota('patient01');
      expect(result).toEqual({
        loginQuota: 3,
        isLocked: false,
        remaining: 7
      });
    });

    it('ควรคืนค่า isLocked: true เมื่อโควตาล็อกอินผิดเกิน 10 ครั้ง', async () => {
      vi.mocked(UserModel.getLoginQuota).mockResolvedValueOnce(10);

      const result = await checkUserLoginQuota('locked_patient');
      expect(result).toEqual({
        loginQuota: 10,
        isLocked: true,
        remaining: 0
      });
    });
  });
});
