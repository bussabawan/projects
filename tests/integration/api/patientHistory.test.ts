import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/patient-history/[userId]/route';
import { PatientHistoryModel } from '@/lib/models/patientHistory';

vi.mock('@/lib/models/patientHistory', () => ({
  PatientHistoryModel: {
    getHistory: vi.fn()
  }
}));

describe('API Route /api/patient-history/[userId] (Integration Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ควรดึงประวัติการฝึกของผู้ป่วยตาม userId และช่วงวันที่สำเร็จ', async () => {
    const mockHistory = {
      history: [
        { id: 1, type: 'matching', testDate: '2026-03-01', score: 10 }
      ],
      total: 1,
      page: 1,
      totalPages: 1
    };
    vi.mocked(PatientHistoryModel.getHistory).mockResolvedValueOnce(mockHistory as unknown as import('@/lib/models/patientHistory').HistoryResponse);

    const req = new NextRequest('http://localhost:3000/api/patient-history/p1?startDate=2026-01-01&endDate=2026-03-01&page=1&limit=5');
    const params = Promise.resolve({ userId: 'p1' });

    const res = await GET(req, { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(mockHistory);
    expect(PatientHistoryModel.getHistory).toHaveBeenCalledWith('p1', '2026-01-01', '2026-03-01', 1, 5);
  });

  it('ควรตอบกลับ status 500 เมื่อเกิดข้อผิดพลาดในการดึงประวัติ', async () => {
    vi.mocked(PatientHistoryModel.getHistory).mockRejectedValueOnce(new Error('DB Error'));

    const req = new NextRequest('http://localhost:3000/api/patient-history/p99');
    const params = Promise.resolve({ userId: 'p99' });

    const res = await GET(req, { params });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('DB Error');
  });
});
