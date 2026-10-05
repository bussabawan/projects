import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUT, DELETE, PATCH } from '@/app/api/admin/users/[id]/route';
import { ManageUsersModel } from '@/lib/models/manageUsers';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn()
}));

vi.mock('@/lib/models/manageUsers', () => ({
  ManageUsersModel: {
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    restoreUser: vi.fn()
  }
}));

describe('API Route /api/admin/users/[id] (Integration Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PUT /api/admin/users/[id]', () => {
    it('ควรตอบกลับ status 400 เมื่อ id ไม่ใช่ตัวเลข', async () => {
      const req = new Request('http://localhost:3000/api/admin/users/invalid', {
        method: 'PUT',
        body: JSON.stringify({})
      });
      const params = Promise.resolve({ id: 'invalid' });

      const res = await PUT(req, { params });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid user ID');
    });

    it('ควรอัปเดตข้อมูลผู้ใช้สำเร็จ', async () => {
      vi.mocked(ManageUsersModel.updateUser).mockResolvedValueOnce(undefined);

      const req = new Request('http://localhost:3000/api/admin/users/5', {
        method: 'PUT',
        body: JSON.stringify({ role: 1, login_quota: 10, exercises_id: [1, 2] })
      });
      const params = Promise.resolve({ id: '5' });

      const res = await PUT(req, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(ManageUsersModel.updateUser).toHaveBeenCalledWith(5, expect.objectContaining({
        role: 1,
        login_quota: 10,
        exercises_id: [1, 2]
      }));
    });

    it('ควรตอบกลับ status 409 requireRestore เมื่อชื่อผู้ใช้ไปซ้ำกับผู้ใช้ที่เคยถูกลบ', async () => {
      vi.mocked(ManageUsersModel.updateUser).mockRejectedValueOnce(new Error('RESTORE_REQUIRED:99'));

      const req = new Request('http://localhost:3000/api/admin/users/5', {
        method: 'PUT',
        body: JSON.stringify({ username: 'deleted_user' })
      });
      const params = Promise.resolve({ id: '5' });

      const res = await PUT(req, { params });
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.requireRestore).toBe(true);
      expect(json.existingUserId).toBe(99);
    });
  });

  describe('DELETE /api/admin/users/[id]', () => {
    it('ควรลบผู้ใช้สำเร็จ', async () => {
      vi.mocked(ManageUsersModel.deleteUser).mockResolvedValueOnce(undefined);

      const req = new Request('http://localhost:3000/api/admin/users/5', { method: 'DELETE' });
      const params = Promise.resolve({ id: '5' });

      const res = await DELETE(req, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(ManageUsersModel.deleteUser).toHaveBeenCalledWith(5);
    });
  });

  describe('PATCH /api/admin/users/[id]', () => {
    it('ควรกู้คืนผู้ใช้สำเร็จเมื่อ action="restore"', async () => {
      vi.mocked(ManageUsersModel.restoreUser).mockResolvedValueOnce(undefined);

      const req = new Request('http://localhost:3000/api/admin/users/5', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'restore' })
      });
      const params = Promise.resolve({ id: '5' });

      const res = await PATCH(req, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(ManageUsersModel.restoreUser).toHaveBeenCalledWith(5);
    });

    it('ควรตอบกลับ status 400 เมื่อ action ไม่ถูกต้อง', async () => {
      const req = new Request('http://localhost:3000/api/admin/users/5', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'unknown' })
      });
      const params = Promise.resolve({ id: '5' });

      const res = await PATCH(req, { params });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid action');
    });
  });
});
