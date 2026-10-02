import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/user/games/memory/route';
import { auth } from '@/auth';
import { ManageExercisesModel } from '@/lib/models/manageExercises';

vi.mock('@/auth', () => ({
  auth: vi.fn()
}));

vi.mock('@/lib/models/manageExercises', () => ({
  ManageExercisesModel: {
    getExercisesByPatientId: vi.fn()
  }
}));

describe('API Route /api/user/games/memory (Integration Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ควรตอบกลับ status 401 เมื่อผู้ใช้ไม่ได้ล็อกอิน', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);

    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Unauthorized');
  });

  it('ควรดึงแบบฝึกหัดเกมความจำของคนไข้สำเร็จ', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: '7' },
      expires: '2099-01-01'
    });

    const mockExercises = [
      { exercises_id: 2, exercises_name: 'ชุดฝึกความจำสัตว์' }
    ];
    vi.mocked(ManageExercisesModel.getExercisesByPatientId).mockResolvedValueOnce(mockExercises as unknown as import('@/lib/models/manageExercises').ExerciseInfo[]);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockExercises);
    expect(ManageExercisesModel.getExercisesByPatientId).toHaveBeenCalledWith(7);
  });

  it('ควรตอบกลับ status 500 เมื่อเกิดข้อผิดพลาดในการดึงข้อมูล', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: '7' },
      expires: '2099-01-01'
    });
    vi.mocked(ManageExercisesModel.getExercisesByPatientId).mockRejectedValueOnce(new Error('Query failed'));

    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Failed to fetch exercises');
  });
});
