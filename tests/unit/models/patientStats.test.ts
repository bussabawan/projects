import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatientStatsModel } from '@/lib/models/patientStats';
import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

vi.mock('@/lib/db', () => ({
  db: {
    query: vi.fn(),
    execute: vi.fn(),
    getConnection: vi.fn()
  }
}));

describe('PatientStatsModel (Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPatientStats', () => {
    it('ควรรวบรวมข้อมูลสถิติผู้ป่วยพร้อมชุดแบบฝึกหัดที่ได้รับมอบหมายและชุดที่เคยเล่น', async () => {
      // 1. users_data + patient_data + exercises_data
      const mockPatientRows = [
        { id: 10, name: 'สมชาย ใจดี', patientId: 'HN001', testSet: 'ชุดสัตว์' },
        { id: 10, name: 'สมชาย ใจดี', patientId: 'HN001', testSet: 'ชุดผลไม้' },
        { id: 12, name: 'สมหญิง รักดี', patientId: 'HN002', testSet: '-' }
      ] as unknown as RowDataPacket[];

      // 2. matching_exercises_log
      const mockMatchingRows = [
        { id: 10, testSet: 'ชุดสัตว์' }
      ] as unknown as RowDataPacket[];

      // 3. memory_exercises_log
      const mockMemoryRows = [
        { id: 10, testSet: 'ชุดความจำ' }
      ] as unknown as RowDataPacket[];

      vi.mocked(db.query)
        .mockResolvedValueOnce([mockPatientRows, []] as unknown as [RowDataPacket[], unknown])
        .mockResolvedValueOnce([mockMatchingRows, []] as unknown as [RowDataPacket[], unknown])
        .mockResolvedValueOnce([mockMemoryRows, []] as unknown as [RowDataPacket[], unknown]);

      const result = await PatientStatsModel.getPatientStats();

      expect(result).toHaveLength(2);

      const patient1 = result.find(p => p.id === 10);
      expect(patient1).toBeDefined();
      expect(patient1?.name).toBe('สมชาย ใจดี');
      expect(patient1?.patientId).toBe('HN001');
      expect(patient1?.assignedSets).toContain('ชุดสัตว์');
      expect(patient1?.assignedSets).toContain('ชุดผลไม้');
      expect(patient1?.playedSets).toContain('ชุดสัตว์');
      expect(patient1?.playedSets).toContain('ชุดความจำ');

      const patient2 = result.find(p => p.id === 12);
      expect(patient2).toBeDefined();
      expect(patient2?.assignedSets).toEqual([]);
    });

    it('ควรโยน Error เมื่อการเชื่อมต่อฐานข้อมูลล้มเหลว', async () => {
      vi.mocked(db.query).mockRejectedValueOnce(new Error('DB Failed'));

      await expect(PatientStatsModel.getPatientStats())
        .rejects.toThrow('Failed to fetch patient statistics');
    });
  });
});
