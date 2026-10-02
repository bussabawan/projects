import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getOverviewStats } from '@/app/api/patient-stats/route';
import { GET as getDetailStats } from '@/app/api/patient-stats/[userId]/route';
import { PatientStatsModel } from '@/lib/models/patientStats';
import { PatientDetailStatsModel } from '@/lib/models/patientDetailStats';

vi.mock('@/lib/models/patientStats', () => ({
  PatientStatsModel: {
    getPatientStats: vi.fn()
  }
}));

vi.mock('@/lib/models/patientDetailStats', () => ({
  PatientDetailStatsModel: {
    getPatientDetailStats: vi.fn()
  }
}));

describe('API Route /api/patient-stats (Integration Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/patient-stats', () => {
    it('ควรส่งข้อมูลสถิติภาพรวมของผู้ป่วยสำเร็จ', async () => {
      const mockStats = [
        { id: 1, name: 'สมชาย', matchingTotal: 10, memoryTotal: 8 }
      ];
      vi.mocked(PatientStatsModel.getPatientStats).mockResolvedValueOnce(mockStats as unknown as Awaited<ReturnType<typeof PatientStatsModel.getPatientStats>>);

      const res = await getOverviewStats();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual(mockStats);
    });

    it('ควรตอบกลับ status 500 เมื่อการดึงข้อมูลล้มเหลว', async () => {
      vi.mocked(PatientStatsModel.getPatientStats).mockRejectedValueOnce(new Error('DB Error'));

      const res = await getOverviewStats();
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe('Failed to fetch patient statistics');
    });
  });

  describe('GET /api/patient-stats/[userId]', () => {
    it('ควรดึงสถิติละเอียดของผู้ป่วยตาม userId และ filters สำเร็จ', async () => {
      const mockDetail = {
        scoreStats: { total: { correct: 10, incorrect: 2 } },
        dailyStats: []
      };
      vi.mocked(PatientDetailStatsModel.getPatientDetailStats).mockResolvedValueOnce(mockDetail as unknown as Awaited<ReturnType<typeof PatientDetailStatsModel.getPatientDetailStats>>);

      const req = new NextRequest('http://localhost:3000/api/patient-stats/p1?period=last7&category=สัตว์');
      const params = Promise.resolve({ userId: 'p1' });

      const res = await getDetailStats(req, { params });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual(mockDetail);
      expect(PatientDetailStatsModel.getPatientDetailStats).toHaveBeenCalledWith('p1', {
        period: 'last7',
        category: 'สัตว์',
        exerciseSet: 'all',
        startDate: undefined,
        endDate: undefined
      });
    });

    it('ควรตอบกลับ status 500 เมื่อเกิดข้อผิดพลาดในการดึงสถิติละเอียด', async () => {
      vi.mocked(PatientDetailStatsModel.getPatientDetailStats).mockRejectedValueOnce(new Error('User not found'));

      const req = new NextRequest('http://localhost:3000/api/patient-stats/p99');
      const params = Promise.resolve({ userId: 'p99' });

      const res = await getDetailStats(req, { params });
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe('User not found');
    });
  });
});
