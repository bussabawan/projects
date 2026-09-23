"use server";

import { auth } from "@/auth";
import { GameMemoryModel } from '@/lib/models/gameMemory';

export async function getMemoryGameData(exerciseId: number, numQuestions: number, numAnswers: number, numTargets: number = 1) {
  try {
    // 1. Get all target images for the exercise
    const allTargetImages = await GameMemoryModel.getExerciseImages(exerciseId);
    if (!allTargetImages || allTargetImages.length === 0) {
      return { success: false, error: "ไม่พบข้อมูลรูปภาพสำหรับแบบฝึกหัดนี้ โปรดติดต่อเจ้าหน้าที่" };
    }

    // Helper to format media URL
    const formatMediaUrl = (url: string | undefined | null) => {
      if (!url) return ''; 
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
      if (url.startsWith('/api/uploads/') || url.startsWith('/api/files/')) return url;
      
      const filename = url.split('/').pop();
      return `/api/uploads/${filename}`;
    };

    const questions = [];

    // Loop for numQuestions
    for (let i = 0; i < numQuestions; i++) {
      // Shuffle to pick random targets for this question
      const shuffledTargetsForQ = allTargetImages.sort(() => 0.5 - Math.random());
      const selectedTargets = shuffledTargetsForQ.slice(0, numTargets);
      
      const targetIds = selectedTargets.map(t => t.id);

      // Get distractors (excluding all targets)
      const numDistractors = Math.max(1, numAnswers - numTargets);
      const distractors = await GameMemoryModel.getRandomImages(numDistractors, targetIds, exerciseId);
      
      // Combine targets and distractors
      const rawChoices = [...selectedTargets, ...distractors];
      
      // Format choices and shuffle them
      const choices = rawChoices.map(c => ({
        ...c,
        imageUrl: formatMediaUrl(c.imageUrl) || '/placeholder-image.png',
        audioUrl: formatMediaUrl(c.audioUrl)
      })).sort(() => 0.5 - Math.random());

      // Format targets
      const formattedTargets = selectedTargets.map(t => ({
        ...t,
        imageUrl: formatMediaUrl(t.imageUrl) || '/placeholder-image.png',
        audioUrl: formatMediaUrl(t.audioUrl)
      }));

      questions.push({
        targets: formattedTargets,
        choices: choices,
      });
    }

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
