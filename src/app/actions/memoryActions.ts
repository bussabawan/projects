"use server";

import { auth } from "@/auth";
import { GameMemoryModel } from '@/lib/models/gameMemory';
import { MemoryGameService } from '@/services/games/MemoryGameService';

export async function getExerciseMaxAudioTime(exerciseId: number): Promise<number> {
  try {
    return await GameMemoryModel.getExerciseMaxAudioTime(exerciseId);
  } catch (error) {
    console.error("Failed to fetch max audio time:", error);
    return 2.5; // fallback
  }
}

export async function getMemoryGameData(exerciseId: number, numQuestions: number, numAnswers: number, numTargets: number = 1) {
  try {
    const questions = await MemoryGameService.generateGameData(exerciseId, numQuestions, numAnswers, numTargets);
    return { success: true, data: questions };
  } catch (error) {
    console.error("Failed to fetch memory game data:", error);
    return { success: false, error: "Failed to load game data" };
  }
}

export async function saveMemoryGameResult(
  exerciseId: number,
  logData: {
    totalQuestions: number;
    totalAnswers: number;
    displayTime: number;
    clickCount: number;
    correctCount: number;
    incorrectCount: number;
  }, 
  timeLogs: {
    photoId: number;
    timePerQuestion: string;
  }[]
) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return { success: false, error: "Unauthorized" };
    }
    
    await GameMemoryModel.saveGameLog(Number(session.user.id), exerciseId, logData, timeLogs);
    return { success: true };
  } catch (error) {
    console.error("Failed to save memory game result:", error);
    return { success: false, error: "Failed to save game result" };
  }
}

export async function getUserMemoryGameHistory(limit: number = 7) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) return [];
    return await GameMemoryModel.getUserGameHistory(Number(session.user.id), limit);
  } catch (e) {
    console.error(e);
    return [];
  }
}
