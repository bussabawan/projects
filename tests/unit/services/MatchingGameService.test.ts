import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MatchingGameService } from '@/services/games/MatchingGameService';
import { GameMatchingModel } from '@/lib/models/gameMatching';
import { ImageInfo } from '@/lib/models/manageImages';

// Mock GameMatchingModel
vi.mock('@/lib/models/gameMatching', () => ({
  GameMatchingModel: {
    getExerciseImages: vi.fn(),
    getRandomImages: vi.fn()
  }
}));

describe('MatchingGameService (Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatMediaUrl', () => {
    it('ควรจัดการ path ของรูปภาพและแปลงให้ถูกต้อง', () => {
      const formatMediaUrl = (MatchingGameService as unknown as {
        formatMediaUrl: (url: string | null | undefined) => string;
      }).formatMediaUrl;

      expect(formatMediaUrl(null)).toBe('');
      expect(formatMediaUrl(undefined)).toBe('');
      expect(formatMediaUrl('https://example.com/test.jpg')).toBe('https://example.com/test.jpg');
      expect(formatMediaUrl('/api/files/1?type=image')).toBe('/api/files/1?type=image');
      expect(formatMediaUrl('/api/uploads/dog.jpg')).toBe('/api/uploads/dog.jpg');
      expect(formatMediaUrl('../secret/dog.jpg')).toBe('/api/uploads/dog.jpg');
    });
  });

  describe('shuffleArray', () => {
    it('ควรคงจำนวนสมาชิกเดิมไว้ครบถ้วน', () => {
      const shuffleArray = (MatchingGameService as unknown as {
        shuffleArray: <T>(arr: T[]) => T[];
      }).shuffleArray;
      const original = [1, 2, 3, 4, 5];
      const result = shuffleArray(original);

      expect(result).toHaveLength(original.length);
      expect(result.slice().sort()).toEqual(original.slice().sort());
    });
  });

  describe('generateGameData', () => {
    it('ควร throw error เมื่อไม่พบรูปภาพในแบบฝึกหัด (pie.remove = 0)', async () => {
      vi.mocked(GameMatchingModel.getExerciseImages).mockResolvedValue([]);

      await expect(MatchingGameService.generateGameData(1, 5, 4))
        .rejects.toThrow('ไม่พบข้อมูลรูปภาพสำหรับแบบฝึกหัดนี้ โปรดติดต่อเจ้าหน้าที่');
    });

    it('ควรสร้างชุดคำถามพร้อมตัวเลือกถูกต้องตามจำนวน numQuestions และ numAnswers', async () => {
      const targets: ImageInfo[] = [
        { id: 1, title: 'สุนัข', imageUrl: '/api/files/1?type=image', audioUrl: '/api/files/1?type=audio' },
        { id: 2, title: 'แมว', imageUrl: '/api/files/2?type=image', audioUrl: '/api/files/2?type=audio' }
      ];

      const distractors: ImageInfo[] = [
        { id: 3, title: 'นก', imageUrl: '/api/files/3?type=image', audioUrl: '/api/files/3?type=audio' },
        { id: 4, title: 'แอปเปิ้ล', imageUrl: '/api/files/4?type=image', audioUrl: '/api/files/4?type=audio' }
      ];

      vi.mocked(GameMatchingModel.getExerciseImages).mockResolvedValue(targets);
      vi.mocked(GameMatchingModel.getRandomImages).mockResolvedValue(distractors);

      // ขอ 1 ข้อ, ช้อยส์ข้อละ 3 ตัวเลือก (1 target + 2 distractors)
      const result = await MatchingGameService.generateGameData(1, 1, 3);

      expect(result).toHaveLength(1);
      expect(result[0].choices).toHaveLength(3);
      expect(result[0].target).toBeDefined();
      expect(GameMatchingModel.getExerciseImages).toHaveBeenCalledWith(1);
      expect(GameMatchingModel.getRandomImages).toHaveBeenCalled();
    });
  });
});
