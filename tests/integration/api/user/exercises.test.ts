import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/user/exercises/route';
import { auth } from '@/auth';
import { UserModel } from '@/lib/models/user';

vi.mock('@/auth', () => ({
  auth: vi.fn()
}));

vi.mock('@/lib/models/user', () => ({
  UserModel: {
    getAssignedExercises: vi.fn()
  }
}));

describe('API Route /api/user/exercises (Integration Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ควรตอบกลับ status 401 เมื่อผู้ใช้ไม่ได้ล็อกอิน', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);

    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('ควรดึงแบบฝึกหัดที่ได้รับมอบหมายของคนไข้สำเร็จ', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: '10' },
      expires: '2099-01-01'
    });

    const mockExercises = [
      { exercises_id: 1, exercises_name: 'ชุดฝึกผลไม้' }
    ];
    vi.mocked(UserModel.getAssignedExercises).mockResolvedValueOnce(mockExercises as unknown as import('@/lib/models/user').AssignedExercise[]);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockExercises);
    expect(UserModel.getAssignedExercises).toHaveBeenCalledWith('10');
  });

  it('ควรตอบกลับ status 500 เมื่อเกิดข้อผิดพลาดภายในระบบ', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: '10' },
      expires: '2099-01-01'
    });
    vi.mocked(UserModel.getAssignedExercises).mockRejectedValueOnce(new Error('DB failure'));

    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Internal Server Error');
  });
});
