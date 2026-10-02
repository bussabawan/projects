import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/admin/users/route';
import { ManageUsersModel, UserInfo } from '@/lib/models/manageUsers';

vi.mock('@/lib/models/manageUsers', () => ({
  ManageUsersModel: {
    getUsers: vi.fn(),
    createUser: vi.fn()
  }
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn()
}));

describe('API Route /api/admin/users (Integration Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/users', () => {
    it('ควรดึงรายชื่อผู้ใช้พร้อมการคำนวณ pagination อย่างถูกต้อง', async () => {
      const mockUsers: UserInfo[] = [
        {
          user_id: 10,
          user_name: 'patient01',
          full_name: 'สมชาย ใจดี',
          role: 1,
          login_quota: 0,
          update_time: new Date()
        }
      ];

      vi.mocked(ManageUsersModel.getUsers).mockResolvedValueOnce({
        data: mockUsers,
        total: 1
      });

      const request = new Request('http://localhost:3000/api/admin/users?role=1&page=1&limit=10');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toEqual(mockUsers.map(u => ({ ...u, update_time: u.update_time.toISOString() })));
      expect(json.total).toBe(1);
      expect(json.totalPages).toBe(1);
      expect(ManageUsersModel.getUsers).toHaveBeenCalledWith(1, '', 1, 10);
    });
  });

  describe('POST /api/admin/users', () => {
    it('ควรตอบกลับ status 400 เมื่อขาดข้อมูลจำเป็น (Missing required fields)', async () => {
      const request = new Request('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: 'patient02' }) // ขาด full_name และ role
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toBe('Missing required fields');
    });

    it('ควรตอบกลับ status 400 สำหรับผู้ป่วย (role 1) ที่ไม่ได้เลือกแบบฝึกหัดเริ่มต้น', async () => {
      const request = new Request('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: 'patient02',
          full_name: 'สมศักดิ์',
          role: 1,
          exercises_id: []
        })
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain('กรุณาเลือกชุดแบบฝึกหัดเริ่มต้น');
    });

    it('ควรสร้างผู้ป่วยสำเร็จและตอบกลับ status 201', async () => {
      vi.mocked(ManageUsersModel.createUser).mockResolvedValueOnce(55);

      const request = new Request('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: 'patient02',
          full_name: 'สมศักดิ์ รักสงบ',
          role: 1,
          password: 'pass',
          exercises_id: [1, 2]
        })
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.user_id).toBe(55);
      expect(ManageUsersModel.createUser).toHaveBeenCalledWith({
        user_name: 'patient02',
        full_name: 'สมศักดิ์ รักสงบ',
        role: 1,
        login_quota: 0,
        password: 'pass',
        exercises_id: [1, 2]
      });
    });

    it('ควรตอบกลับ status 409 พร้อม requireRestore: true เมื่อพบผู้ใช้ที่เคยถูกลบไปแล้ว', async () => {
      vi.mocked(ManageUsersModel.createUser).mockRejectedValueOnce(new Error('RESTORE_REQUIRED:99'));

      const request = new Request('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: 'patient_old',
          full_name: 'คนเดิม',
          role: 1,
          exercises_id: [1]
        })
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(409);
      expect(json.success).toBe(false);
      expect(json.requireRestore).toBe(true);
      expect(json.existingUserId).toBe(99);
    });
  });
});
