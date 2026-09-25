"use server";

import { auth } from "@/auth";
import { UserModel } from '@/lib/models/user';
import { ManageExercisesModel } from '@/lib/models/manageExercises';
import { GameMatchingModel } from '@/lib/models/gameMatching';
import { MatchingGameService } from '@/services/games/MatchingGameService';

export async function getUserAssignedExercises() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return [];
    }
    
    return await UserModel.getAssignedExercises(session.user.id);
  } catch (error) {
    console.error("Failed to fetch user assigned exercises:", error);
    return [];
  }
}

export async function getExerciseImageCount(exerciseId: number): Promise<number> {
  try {
    return await ManageExercisesModel.getExerciseImageCount(exerciseId);
  } catch (error) {
    console.error("Failed to fetch exercise image count:", error);
    return 30; // Default fallback
  }
}

export async function getGameData(exerciseId: number, numQuestions: number, numAnswers: number) {
  try {
    const questions = await MatchingGameService.generateGameData(exerciseId, numQuestions, numAnswers);
    return { success: true, data: questions };
  } catch (error) {
    console.error("Failed to fetch game data:", error);
    return { success: false, error: "Failed to load game data" };
  }
}

export async function saveMatchingGameResult(
  exerciseId: number,
  logData: {
    totalQuestions: number;
    totalAnswers: number;
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
    
    await GameMatchingModel.saveGameLog(Number(session.user.id), exerciseId, logData, timeLogs);
    return { success: true };
  } catch (error) {
    console.error("Failed to save game result:", error);
    return { success: false, error: "Failed to save game result" };
  }
}

export async function getUserMatchingGameHistory(limit: number = 7) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) return [];
    return await GameMatchingModel.getUserGameHistory(Number(session.user.id), limit);
  } catch (e) {
    console.error(e);
    return [];
  }
}