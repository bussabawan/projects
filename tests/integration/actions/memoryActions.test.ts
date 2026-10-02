import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getExerciseMaxAudioTime,
  getMemoryGameData,
  saveMemoryGameResult,
  getUserMemoryGameHistory
} from '@/app/actions/memoryActions';
import { auth } from '@/auth';
import { GameMemoryModel } from '@/lib/models/gameMemory';
import { MemoryGameService } from '@/services/games/MemoryGameService';

vi.mock('@/auth', () => ({
  auth: vi.fn()
}));

vi.mock('@/lib/models/gameMemory', () => ({
  GameMemoryModel: {
    getExerciseMaxAudioTime: vi.fn(),
    saveGameLog: vi.fn(),
    getUserGameHistory: vi.fn()
  }
}));

vi.mock('@/services/games/MemoryGameService', () => ({
  MemoryGameService: {
    generateGameData: vi.fn()
  }
}));

describe('memoryActions (Server Actions Integration Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getExerciseMaxAudioTime', () => {
    it('ควรคืนค่าเวลาเสียงสูงสุดจาก GameMemoryModel', async () => {
      vi.mocked(GameMemoryModel.getExerciseMaxAudioTime).mockResolvedValueOnce(3.5);

      const time = await getExerciseMaxAudioTime(1);
      expect(time).toBe(3.5);
    });

    it('ควรคืนค่า fallback 2.5 เมื่อเกิด error', async () => {
      vi.mocked(GameMemoryModel.getExerciseMaxAudioTime).mockRejectedValueOnce(new Error('DB Error'));

      const time = await getExerciseMaxAudioTime(1);
      expect(time).toBe(2.5);
    });
  });

  describe('getMemoryGameData', () => {
    it('ควรคืนค่า success: true พร้อมโจทย์เมื่อสร้างสำเร็จ', async () => {
      const mockQuestions = [{ targets: [{ id: 1 }], choices: [] }];
      vi.mocked(MemoryGameService.generateGameData).mockResolvedValueOnce(mockQuestions as never);

      const result = await getMemoryGameData(1, 5, 4, 1);
      expect(result).toEqual({ success: true, data: mockQuestions });
    });

    it('ควรคืนค่า success: false เมื่อสร้างล้มเหลว', async () => {
      vi.mocked(MemoryGameService.generateGameData).mockRejectedValueOnce(new Error('Failed'));

      const result = await getMemoryGameData(1, 5, 4, 1);
      expect(result).toEqual({ success: false, error: 'Failed to load game data' });
    });
  });

  describe('saveMemoryGameResult', () => {
    it('ควรคืนค่า Unauthorized เมื่อไม่มี session', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as never);

      const result = await saveMemoryGameResult(1, {
        totalQuestions: 5,
        totalAnswers: 5,
        displayTime: 3,
        clickCount: 5,
        correctCount: 5,
        incorrectCount: 0
      }, []);

      expect(result).toEqual({ success: false, error: 'Unauthorized' });
    });

    it('ควรบันทึกผลสำเร็จเมื่อมี session ที่ถูกต้อง', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: '10' }
      } as never);

      const logData = {
        totalQuestions: 5,
        totalAnswers: 5,
        displayTime: 3,
        clickCount: 5,
        correctCount: 5,
        incorrectCount: 0
      };
      const timeLogs = [{ photoId: 1, timePerQuestion: '00:00:02' }];

      const result = await saveMemoryGameResult(1, logData, timeLogs);
      expect(result).toEqual({ success: true });
      expect(GameMemoryModel.saveGameLog).toHaveBeenCalledWith(10, 1, logData, timeLogs);
    });
  });

  describe('getUserMemoryGameHistory', () => {
    it('ควรดึงประวัติการเล่นเมื่อมี session', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: '10' }
      } as never);

      const mockHistory = [
        { id: 1, totalQuestions: 3, clickCount: 4, correctCount: 3, testDate: new Date() }
      ];
      vi.mocked(GameMemoryModel.getUserGameHistory).mockResolvedValueOnce(mockHistory);

      const history = await getUserMemoryGameHistory(7);
      expect(history).toEqual(mockHistory);
      expect(GameMemoryModel.getUserGameHistory).toHaveBeenCalledWith(10, 7);
    });
  });
});
