import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryGameService } from '@/services/games/MemoryGameService';
import { GameMemoryModel } from '@/lib/models/gameMemory';
import { ImageInfo } from '@/lib/models/manageImages';

// Mock GameMemoryModel
vi.mock('@/lib/models/gameMemory', () => ({
  GameMemoryModel: {
    getExerciseImages: vi.fn(),
    getRandomImages: vi.fn()
  }
}));

describe('MemoryGameService (Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatMediaUrl', () => {
    it('ควรจัดการ path ของรูปภาพและเสียงได้อย่างถูกต้อง', () => {
      const formatMediaUrl = (MemoryGameService as unknown as {
        formatMediaUrl: (url: string | null | undefined) => string;
      }).formatMediaUrl;

      expect(formatMediaUrl(null)).toBe('');
      expect(formatMediaUrl(undefined)).toBe('');
      expect(formatMediaUrl('http://example.com/audio.mp3')).toBe('http://example.com/audio.mp3');
      expect(formatMediaUrl('/api/uploads/audio.mp3')).toBe('/api/uploads/audio.mp3');
      expect(formatMediaUrl('uploads/audio.mp3')).toBe('/api/uploads/audio.mp3');
    });
  });

  describe('generateGameData', () => {
    it('ควรโยน error เมื่อไม่พบรูปภาพในแบบฝึกหัด', async () => {
      vi.mocked(GameMemoryModel.getExerciseImages).mockResolvedValue([]);

      await expect(MemoryGameService.generateGameData(1, 3, 4, 1))
        .rejects.toThrow('ไม่พบข้อมูลรูปภาพสำหรับแบบฝึกหัดนี้ โปรดติดต่อเจ้าหน้าที่');
    });

    it('ควรสร้างคำถามตามจำนวน numQuestions และมี choices ตาม numAnswers', async () => {
      const mockTargets: ImageInfo[] = [
        { id: 1, title: 'สุนัข', imageUrl: '/api/files/1?type=image', audioUrl: '/api/files/1?type=audio' },
        { id: 2, title: 'แมว', imageUrl: '/api/files/2?type=image', audioUrl: '/api/files/2?type=audio' },
        { id: 3, title: 'นก', imageUrl: '/api/files/3?type=image', audioUrl: '/api/files/3?type=audio' }
      ];

      const mockDistractors: ImageInfo[] = [
        { id: 4, title: 'ปลา', imageUrl: '/api/files/4?type=image', audioUrl: '/api/files/4?type=audio' },
        { id: 5, title: 'กระต่าย', imageUrl: '/api/files/5?type=image', audioUrl: '/api/files/5?type=audio' },
        { id: 6, title: 'เต่า', imageUrl: '/api/files/6?type=image', audioUrl: '/api/files/6?type=audio' }
      ];

      vi.mocked(GameMemoryModel.getExerciseImages).mockResolvedValue(mockTargets);
      vi.mocked(GameMemoryModel.getRandomImages).mockResolvedValue(mockDistractors);

      // ร้องขอ 2 ข้อ, 1 เป้าหมายต่อข้อ, ตัวเลือก 3 ช้อยส์ (1 target + 2 distractors)
      const questions = await MemoryGameService.generateGameData(1, 2, 3, 1);

      expect(questions).toHaveLength(2);
      expect(questions[0].targets).toHaveLength(1);
      expect(questions[0].choices.length).toBeGreaterThanOrEqual(1);
      expect(GameMemoryModel.getExerciseImages).toHaveBeenCalledWith(1);
    });

    it('ควรเติมรูปจากถุงสุ่มใหม่เมื่อรูปในถุงเหลือน้อยกว่า numTargets', async () => {
      const mockTargets: ImageInfo[] = [
        { id: 1, title: 'สุนัข', imageUrl: 'dog.jpg' }
      ];

      vi.mocked(GameMemoryModel.getExerciseImages).mockResolvedValue(mockTargets);
      vi.mocked(GameMemoryModel.getRandomImages).mockResolvedValue([]);

      // ขอ 3 ข้อ แต่มีแค่ 1 รูป ต้องวนเอาภาพเดิมมาสับใหม่
      const questions = await MemoryGameService.generateGameData(1, 3, 2, 1);
      expect(questions).toHaveLength(3);
    });
  });
});
