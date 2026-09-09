"use server";

import { auth } from "@/auth";
import { UserModel } from '@/lib/models/user';
import { ManageExercisesModel } from '@/lib/models/manageExercises';
import { GameMatchingModel } from '@/lib/models/gameMatching';

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
    // 1. Get all target images for the exercise
    const allTargetImages = await GameMatchingModel.getExerciseImages(exerciseId);
    if (!allTargetImages || allTargetImages.length === 0) {
      return { success: false, error: "ไม่พบข้อมูลรูปภาพสำหรับแบบฝึกหัดนี้ โปรดติดต่อเจ้าหน้าที่" };
    }

    // Shuffle and pick numQuestions target images
    const shuffledTargets = allTargetImages.sort(() => 0.5 - Math.random());
    const selectedTargets = shuffledTargets.slice(0, numQuestions);

    // Helper to format media URL
    const formatMediaUrl = (url: string | undefined | null) => {
      if (!url) return ''; 
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
      if (url.startsWith('/api/uploads/') || url.startsWith('/api/files/')) return url;
      
      // Extract just the filename to prevent directory traversal errors in the API route
      const filename = url.split('/').pop();
      return `/api/uploads/${filename}`;
    };

    const questions = [];

    // 2. For each target image, pick distractor images
    for (const target of selectedTargets) {
      // Get distractors (excluding the target itself)
      const distractors = await GameMatchingModel.getRandomImages(numAnswers - 1, [target.id], exerciseId);
      
      // Combine target and distractors
      const rawChoices = [target, ...distractors];
      
      const choices = rawChoices.map(c => ({
        ...c,
        imageUrl: formatMediaUrl(c.imageUrl) || '/placeholder-image.png',
        audioUrl: formatMediaUrl(c.audioUrl)
      }));

      // Shuffle choices
      const shuffledChoices = choices.sort(() => 0.5 - Math.random());

      questions.push({
        target: { 
          ...target, 
          imageUrl: formatMediaUrl(target.imageUrl) || '/placeholder-image.png',
          audioUrl: formatMediaUrl(target.audioUrl)
        },
        choices: shuffledChoices,
      });
    }

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