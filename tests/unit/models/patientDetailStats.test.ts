import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatientDetailStatsModel } from '@/lib/models/patientDetailStats';

// Mock BaseModel.query
vi.mock('@/lib/models/BaseModel', () => {
  return {
    BaseModel: class {
      static query = vi.fn();
      static execute = vi.fn();
      static transaction = vi.fn();
    }
  };
});

describe('PatientDetailStatsModel (Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPatientDetailStats', () => {
    it('ควรโยน Error เมื่อไม่ระบุ userId', async () => {
      await expect(
        PatientDetailStatsModel.getPatientDetailStats('')
      ).rejects.toThrow('User ID is required');
    });

    it('ควรดึงสถิติละเอียดของคนไข้สำเร็จเมื่อไม่มี filter', async () => {
      const mockQuery = vi.spyOn(PatientDetailStatsModel, 'query');

      // 1. availableFiltersQuery
      mockQuery.mockResolvedValueOnce([{ exercises_name: 'ชุดฝึกผลไม้' }]);
      // 2. availableCategoriesQuery
      mockQuery.mockResolvedValueOnce([{ category_name: 'ผลไม้' }]);
      // 3. exerciseCategoryMapQuery
      mockQuery.mockResolvedValueOnce([{ exercises_name: 'ชุดฝึกผลไม้', category_name: 'ผลไม้' }]);
      // 4. matchingQuery
      mockQuery.mockResolvedValueOnce([
        { totalCorrect: '10', totalIncorrect: '2', totalAnswers: '12', playCount: '2', dateStr: '2026-03-01' }
      ]);
      // 5. memoryQuery
      mockQuery.mockResolvedValueOnce([
        { totalCorrect: '8', totalIncorrect: '1', totalAnswers: '9', playCount: '1', dateStr: '2026-03-01' }
      ]);
      // 6. loginQuery
      mockQuery.mockResolvedValueOnce([
        { loginCount: '3', dateStr: '2026-03-01' }
      ]);
      // 7. timeQuery
      mockQuery.mockResolvedValueOnce([
        { dateStr: '2026-03-01', seconds: '15', mode: 'จับคู่' },
        { dateStr: '2026-03-01', seconds: '25', mode: 'ความจำ' }
      ]);
      // 8. scatterQuery
      mockQuery.mockResolvedValueOnce([
        { dateStr: '2026-03-01', timeOfDay: 9.5, timeStr: '09:30', duration: 40, mode: 'จับคู่', score: 10 }
      ]);

      const result = await PatientDetailStatsModel.getPatientDetailStats('patient-1');

      expect(result).toBeDefined();
      expect(result.scoreStats.total.correct).toBe(18);
      expect(result.scoreStats.total.incorrect).toBe(3);
      expect(result.scoreStats.separated.matching.correct).toBe(10);
      expect(result.scoreStats.separated.memory.correct).toBe(8);
      expect(result.availableExerciseSets).toEqual(['ชุดฝึกผลไม้']);
      expect(result.availableCategories).toEqual(['ผลไม้']);
      expect(result.exerciseCategoryMap['ชุดฝึกผลไม้']).toEqual(['ผลไม้']);
      expect(result.dailyStats.length).toBe(1);
      expect(result.dailyStats[0].answers).toBe(21);
      expect(result.dailyStats[0].logins).toBe(3);
      expect(result.dailyStats[0].totalSeconds).toBe(40);
      expect(result.dailyStats[0].matchingAvgSeconds).toBe(15);
      expect(result.dailyStats[0].memoryAvgSeconds).toBe(25);
      expect(result.scatterStats.length).toBe(1);
      expect(result.scatterStats[0].score).toBe(10);
    });

    it('ควรรองรับกรณี memory และ login มีวันที่ไม่ซ้ำกับ matching (สร้าง entry ใหม่ใน map)', async () => {
      const mockQuery = vi.spyOn(PatientDetailStatsModel, 'query');

      // 1. availableFiltersQuery
      mockQuery.mockResolvedValueOnce([]);
      // 2. availableCategoriesQuery
      mockQuery.mockResolvedValueOnce([]);
      // 3. exerciseCategoryMapQuery
      mockQuery.mockResolvedValueOnce([]);
      // 4. matchingQuery (ไม่มี matching)
      mockQuery.mockResolvedValueOnce([]);
      // 5. memoryQuery (มี memory วันที่ 2026-03-02)
      mockQuery.mockResolvedValueOnce([
        { totalCorrect: '5', totalIncorrect: '0', totalAnswers: '5', playCount: '1', dateStr: '2026-03-02' }
      ]);
      // 6. loginQuery (มี login วันที่ 2026-03-03)
      mockQuery.mockResolvedValueOnce([
        { loginCount: '1', dateStr: '2026-03-03' }
      ]);
      // 7. timeQuery
      mockQuery.mockResolvedValueOnce([]);
      // 8. scatterQuery
      mockQuery.mockResolvedValueOnce([]);

      const result = await PatientDetailStatsModel.getPatientDetailStats('patient-1');
      expect(result.dailyStats).toHaveLength(2);
      expect(result.dailyStats[0].dateStr).toBe('2026-03-02');
      expect(result.dailyStats[1].dateStr).toBe('2026-03-03');
    });

    it('ควรรองรับตัวกรอง period ต่างๆ เช่น today, last7, last30, thisYear และ custom', async () => {
      const mockQuery = vi.spyOn(PatientDetailStatsModel, 'query');
      mockQuery.mockResolvedValue([]);

      // ทดสอบ custom date
      const resultCustom = await PatientDetailStatsModel.getPatientDetailStats('patient-1', {
        period: 'custom',
        startDate: '2026-01-01',
        endDate: '2026-03-01',
        category: 'ผลไม้',
        exerciseSet: 'ชุดผลไม้ 1'
      });

      expect(resultCustom.scoreStats.total.correct).toBe(0);
      expect(mockQuery).toHaveBeenCalled();

      // ทดสอบ period อื่นๆ
      await PatientDetailStatsModel.getPatientDetailStats('patient-1', { period: 'today' });
      await PatientDetailStatsModel.getPatientDetailStats('patient-1', { period: 'last7' });
      await PatientDetailStatsModel.getPatientDetailStats('patient-1', { period: 'last30' });
      await PatientDetailStatsModel.getPatientDetailStats('patient-1', { period: 'thisYear' });
    });
  });
});
