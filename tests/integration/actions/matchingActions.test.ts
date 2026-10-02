import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getUserAssignedExercises,
  getExerciseImageCount,
  getGameData,
  saveMatchingGameResult,
  getUserMatchingGameHistory
} from '@/app/actions/matchingActions';
import { auth } from '@/auth';
import { UserModel } from '@/lib/models/user';
import { ManageExercisesModel } from '@/lib/models/manageExercises';
import { GameMatchingModel } from '@/lib/models/gameMatching';
import { MatchingGameService } from '@/services/games/MatchingGameService';

vi.mock('@/auth', () => ({
  auth: vi.fn()
}));

vi.mock('@/lib/models/user', () => ({
  UserModel: {
    getAssignedExercises: vi.fn()
  }
}));

vi.mock('@/lib/models/manageExercises', () => ({
  ManageExercisesModel: {
    getExerciseImageCount: vi.fn()
  }
}));

vi.mock('@/lib/models/gameMatching', () => ({
  GameMatchingModel: {
    saveGameLog: vi.fn(),
    getUserGameHistory: vi.fn()
  }
}));

vi.mock('@/services/games/MatchingGameService', () => ({
  MatchingGameService: {
    generateGameData: vi.fn()
  }
}));

describe('matchingActions (Server Actions Integration Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserAssignedExercises', () => {
    it('ควรคืนค่า [] เมื่อไม่มี Session ผู้ใช้', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as never);

      const exercises = await getUserAssignedExercises();
      expect(exercises).toEqual([]);
      expect(UserModel.getAssignedExercises).not.toHaveBeenCalled();
    });

    it('ควรคืนค่าแบบฝึกหัดเมื่อมี Session ที่ถูกต้อง', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: '10', name: 'Patient 01' }
      } as never);

      const mockExercises = [{ exercises_id: 1, exercises_name: 'แบบฝึกหัด 1' }];
      vi.mocked(UserModel.getAssignedExercises).mockResolvedValueOnce(mockExercises);

      const exercises = await getUserAssignedExercises();
      expect(exercises).toEqual(mockExercises);
      expect(UserModel.getAssignedExercises).toHaveBeenCalledWith('10');
    });
  });

  describe('getExerciseImageCount', () => {
    it('ควรเรียก ManageExercisesModel และคืนจำนวนรูปภาพ', async () => {
      vi.mocked(ManageExercisesModel.getExerciseImageCount).mockResolvedValueOnce(25);

      const count = await getExerciseImageCount(1);
      expect(count).toBe(25);
    });

    it('ควรคืนค่า fallback 30 เมื่อเกิดข้อผิดพลาด', async () => {
      vi.mocked(ManageExercisesModel.getExerciseImageCount).mockRejectedValueOnce(new Error('DB Error'));

      const count = await getExerciseImageCount(1);
      expect(count).toBe(30);
    });
  });

  describe('getGameData', () => {
    it('ควรคืนค่า { success: true, data: questions } เมื่อสร้างโจทย์สำเร็จ', async () => {
      const mockQuestions = [{ target: { id: 1 }, choices: [] }];
      vi.mocked(MatchingGameService.generateGameData).mockResolvedValueOnce(mockQuestions as never);

      const result = await getGameData(1, 5, 4);
      expect(result).toEqual({ success: true, data: mockQuestions });
    });

    it('ควรคืนค่า { success: false, error: ... } เมื่อเกิดข้อผิดพลาด', async () => {
      vi.mocked(MatchingGameService.generateGameData).mockRejectedValueOnce(new Error('Game error'));

      const result = await getGameData(1, 5, 4);
      expect(result).toEqual({ success: false, error: 'Failed to load game data' });
    });
  });

  describe('saveMatchingGameResult', () => {
    it('ควรคืนค่า Unauthorized เมื่อไม่มี Session', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as never);

      const result = await saveMatchingGameResult(1, {
        totalQuestions: 5,
        totalAnswers: 5,
        clickCount: 5,
        correctCount: 5,
        incorrectCount: 0
      }, []);

      expect(result).toEqual({ success: false, error: 'Unauthorized' });
      expect(GameMatchingModel.saveGameLog).not.toHaveBeenCalled();
    });

    it('ควรบันทึกผลสำเร็จเมื่อมี Session ที่ถูกต้อง', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: '10', name: 'Patient 01' }
      } as never);

      const logData = {
        totalQuestions: 5,
        totalAnswers: 5,
        clickCount: 6,
        correctCount: 5,
        incorrectCount: 1
      };
      const timeLogs = [{ photoId: 1, timePerQuestion: '00:00:03' }];

      const result = await saveMatchingGameResult(1, logData, timeLogs);
      expect(result).toEqual({ success: true });
      expect(GameMatchingModel.saveGameLog).toHaveBeenCalledWith(10, 1, logData, timeLogs);
    });
  });

  describe('getUserMatchingGameHistory', () => {
    it('ควรคืนค่าประวัติการเล่นเกมเมื่อมี Session', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: '10' }
      } as never);

      const mockHistory = [
        { id: 1, totalQuestions: 5, clickCount: 5, correctCount: 5, testDate: new Date() }
      ];
      vi.mocked(GameMatchingModel.getUserGameHistory).mockResolvedValueOnce(mockHistory);

      const history = await getUserMatchingGameHistory(7);
      expect(history).toEqual(mockHistory);
      expect(GameMatchingModel.getUserGameHistory).toHaveBeenCalledWith(10, 7);
    });
  });
});
